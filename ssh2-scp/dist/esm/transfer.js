import * as fs from "fs";
import * as path from "path";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
class Transfer {
  session;
  options;
  chunkSize;
  state;
  aborted = false;
  sshFs;
  pauseTarget = null;
  activeChannel = null;
  constructor(sshFs, options) {
    this.sshFs = sshFs;
    this.session = sshFs.session;
    this.options = options;
    this.chunkSize = options.chunkSize || 4096;
    this.state = {
      transferred: 0,
      total: 0,
      paused: false,
      completed: false
    };
  }
  async startTransfer() {
    if (this.state.completed || this.state.error || this.aborted) {
      return;
    }
    if (!this.options.chunkSize) {
      this.chunkSize = await this.sshFs.getChunkSize();
    }
    const isDownload = this.options.type === "download";
    try {
      if (isDownload) {
        await this.download();
      } else {
        await this.upload();
      }
      this.state.completed = true;
    } catch (err) {
      this.state.error = err;
      throw err;
    } finally {
      this.pauseTarget = null;
      this.activeChannel = null;
    }
  }
  async getRemoteFileSize(remotePath) {
    const output = await this.runExec(`stat -c %s "${remotePath}" 2>/dev/null || stat -f %z "${remotePath}" 2>/dev/null`);
    return parseInt(output.trim(), 10) || 0;
  }
  runExec(cmd) {
    return new Promise((resolve, reject) => {
      this.session.exec(cmd, (err, stream) => {
        if (err) {
          return reject(err);
        }
        let out = Buffer.from("");
        stream.on("close", () => {
          resolve(out.toString());
        }).on("data", (data) => {
          out = Buffer.concat([out, data]);
        }).stderr.on("data", (data) => {
          console.error("stderr:", data.toString());
        });
      });
    });
  }
  async download() {
    const { remotePath, localPath } = this.options;
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.state.total = await this.getRemoteFileSize(remotePath);
    const channel = await this.execStream(`dd if="${remotePath}" bs=${this.chunkSize}`);
    this.activeChannel = channel;
    this.pauseTarget = channel;
    const closePromise = this.waitForChannelClose(channel);
    const writeStream = fs.createWriteStream(localPath, { highWaterMark: this.chunkSize });
    try {
      await Promise.all([
        pipeline(this.channelToReadable(channel), this.createProgressStream(), writeStream),
        closePromise
      ]);
    } catch (err) {
      this.activeChannel?.close();
      throw err;
    }
  }
  async upload() {
    const { remotePath, localPath } = this.options;
    const localStats = await fs.promises.stat(localPath);
    if (!localStats.isFile()) {
      throw new Error(`Local path is not a file: ${localPath}`);
    }
    this.state.total = localStats.size;
    const channel = await this.execStream(`dd of="${remotePath}" bs=${this.chunkSize}`);
    this.activeChannel = channel;
    const closePromise = this.waitForChannelClose(channel);
    const readStream = fs.createReadStream(localPath, { highWaterMark: this.chunkSize });
    this.pauseTarget = readStream;
    try {
      await Promise.all([
        pipeline(readStream, this.createProgressStream(), this.getChannelWritable(channel)),
        closePromise
      ]);
    } catch (err) {
      this.activeChannel?.close();
      throw err;
    }
  }
  pause() {
    this.state.paused = true;
    this.pauseTarget?.pause();
  }
  resume() {
    this.state.paused = false;
    this.pauseTarget?.resume();
  }
  getState() {
    return { ...this.state };
  }
  destroy() {
    this.aborted = true;
    this.pauseTarget?.destroy?.(this.createAbortError());
    this.activeChannel?.close();
  }
  createAbortError() {
    return new Error("Transfer aborted");
  }
  /**
   * Wrap an exec channel in a real `Readable` so it can be used as a
   * `pipeline()` source.
   *
   * An ssh2 `ClientChannel` is a `Duplex` created with `emitClose: false`, so it
   * never emits a stream `'close'` event. `pipeline()` (and `finished()`) wait
   * for exactly that event to observe a source being torn down, which means:
   *
   *   - when the destination fails, pipeline destroys the source, but the
   *     channel never reports the close and the pipeline promise stays pending
   *     **forever** — a full local disk hung the download with no error and no
   *     rejection at all;
   *   - calling `channel.close()` by hand does not help, because that only
   *     sends CHANNEL_CLOSE on the wire and still emits no stream event.
   *
   * Feeding the channel into a plain `Readable` (which does emit `'close'`)
   * restores the normal semantics: pipeline can destroy it, the destroy closes
   * the channel — which is what unblocks the remote `dd` — and the pipeline
   * promise rejects with the original error.
   */
  channelToReadable(channel) {
    const source = new Readable({
      highWaterMark: this.chunkSize,
      read: () => {
        if (!this.state.paused) {
          channel.resume();
        }
      }
    });
    channel.on("data", (chunk) => {
      if (!source.push(chunk)) {
        channel.pause();
      }
    });
    channel.on("end", () => source.push(null));
    channel.on("error", (error) => source.destroy(error));
    source.on("close", () => channel.close());
    return source;
  }
  createProgressStream() {
    return new Transform({
      highWaterMark: this.chunkSize,
      transform: (chunk, _encoding, callback) => {
        if (this.aborted) {
          callback(this.createAbortError());
          return;
        }
        const byteLength = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(String(chunk));
        this.state.transferred += byteLength;
        if (this.options.onProgress) {
          const visibleTransferred = this.state.total > 0 ? Math.min(this.state.transferred, this.state.total) : this.state.transferred;
          this.options.onProgress(visibleTransferred, this.state.total);
        }
        if (this.options.onData) {
          this.options.onData(byteLength);
        }
        callback(null, chunk);
      }
    });
  }
  getChannelWritable(channel) {
    const withStdin = channel;
    return withStdin.stdin || channel;
  }
  execStream(cmd) {
    return new Promise((resolve, reject) => {
      this.session.exec(cmd, (err, channel) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(channel);
      });
    });
  }
  waitForChannelClose(channel) {
    return new Promise((resolve, reject) => {
      let stderr = "";
      let settled = false;
      const settle = (error) => {
        if (settled) {
          return;
        }
        settled = true;
        if (error) {
          reject(error);
          return;
        }
        resolve();
      };
      const handleExit = (code) => {
        if (this.aborted) {
          settle(this.createAbortError());
          return;
        }
        if (typeof code === "number" && code !== 0) {
          settle(new Error(stderr.trim() || `Remote command failed with exit code ${code}`));
          return;
        }
        settle();
      };
      channel.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      channel.on("exit", handleExit);
      channel.on("close", handleExit);
      channel.on("error", (error) => {
        settle(error);
      });
    });
  }
}
export {
  Transfer
};
