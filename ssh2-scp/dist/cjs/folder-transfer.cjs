"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const promises = require("stream/promises");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const TAR_HEADER_SIZE = 512;
const TAR_NAME_OFFSET = 0;
const TAR_NAME_SIZE = 100;
const TAR_PREFIX_OFFSET = 345;
const TAR_PREFIX_SIZE = 155;
const TAR_CHKSUM_OFFSET = 148;
const TAR_CHKSUM_SIZE = 8;
const TAR_MAGIC_OFFSET = 257;
const TAR_MAGIC_SIZE = 8;
class FolderTransfer {
  session;
  tarAdapter;
  runRemoteCommand;
  options;
  chunkSize;
  state;
  aborted = false;
  platformPromise = null;
  pauseTarget = null;
  activeChannel = null;
  iconv;
  encoding;
  constructor(session, tarAdapter, options) {
    this.session = session;
    this.tarAdapter = tarAdapter;
    this.runRemoteCommand = this.runExec.bind(this);
    this.options = options;
    this.chunkSize = options.chunkSize || 32768;
    this.iconv = options.iconv;
    this.encoding = (options.encoding || "utf-8").toLowerCase().replace(/[^a-z0-9-]/g, "");
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
    try {
      if (this.options.type === "download") {
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
    return new Error("Folder transfer aborted");
  }
  needsEncodingConversion() {
    return !!this.iconv && this.encoding !== "utf-8" && this.encoding !== "utf8" && this.encoding !== "ascii";
  }
  /**
   * Creates a Transform stream that converts filename encoding in tar headers.
   * Handles both USTAR headers and PAX extended headers.
   * For PAX headers, parses the key=value pairs and converts the `path` value.
   * For USTAR headers, converts the name/prefix fields directly.
   * Recomputes checksums and sizes after modification.
   */
  createTarEncodingTransform(srcEnc, dstEnc) {
    const iconv = this.iconv;
    let remaining = Buffer.alloc(0);
    let skipBytes = 0;
    const convertPath = (buf) => {
      try {
        return iconv.encode(iconv.decode(buf, srcEnc), dstEnc);
      } catch {
        return buf;
      }
    };
    return new stream.Transform({
      transform(chunk, _encoding, callback) {
        const buf = remaining.length > 0 ? Buffer.concat([remaining, chunk]) : Buffer.from(chunk);
        let pos = 0;
        const parts = [];
        while (pos < buf.length) {
          if (skipBytes > 0) {
            const n = Math.min(skipBytes, buf.length - pos);
            parts.push(buf.subarray(pos, pos + n));
            pos += n;
            skipBytes -= n;
            continue;
          }
          if (pos + TAR_HEADER_SIZE > buf.length) break;
          const block = buf.subarray(pos, pos + TAR_HEADER_SIZE);
          if (block[0] === 0 && block.every((b) => b === 0)) {
            parts.push(buf.subarray(pos));
            remaining = Buffer.alloc(0);
            callback(null, Buffer.concat(parts));
            return;
          }
          const magic = block.subarray(TAR_MAGIC_OFFSET, TAR_MAGIC_OFFSET + TAR_MAGIC_SIZE).toString("ascii").replace(/\0/g, "").trim();
          if (magic !== "ustar") {
            parts.push(block);
            pos += TAR_HEADER_SIZE;
            continue;
          }
          const typeflag = String.fromCharCode(block[156]);
          const sizeStr = block.subarray(124, 136).toString("ascii").replace(/\0/g, "").trim();
          const dataSize = parseInt(sizeStr, 8) || 0;
          const dataBlocks = Math.ceil(dataSize / TAR_HEADER_SIZE) * TAR_HEADER_SIZE;
          if ((typeflag === "x" || typeflag === "g") && dataSize > 0) {
            const totalBlocks = TAR_HEADER_SIZE + dataBlocks;
            if (pos + totalBlocks > buf.length) break;
            const paxData = buf.subarray(pos + TAR_HEADER_SIZE, pos + TAR_HEADER_SIZE + dataSize);
            const paxStr = paxData.toString("utf-8");
            const paxLines = paxStr.split("\n").filter((l) => l.length > 0);
            let modified = false;
            const newLines = [];
            for (const line of paxLines) {
              const spaceIdx = line.indexOf(" ");
              if (spaceIdx === -1) {
                newLines.push(line);
                continue;
              }
              const kv = line.substring(spaceIdx + 1);
              const eqIdx = kv.indexOf("=");
              if (eqIdx === -1) {
                newLines.push(line);
                continue;
              }
              const keyword = kv.substring(0, eqIdx);
              const value = kv.substring(eqIdx + 1);
              if (keyword === "path") {
                const valueBuf = Buffer.from(value, "utf-8");
                const converted2 = convertPath(valueBuf);
                if (!converted2.equals(valueBuf)) {
                  const newValue = converted2.toString("utf-8");
                  const newKv = `${keyword}=${newValue}`;
                  const newLine = `${Buffer.byteLength(newKv, "utf-8") + 1} ${newKv}`;
                  newLines.push(newLine);
                  modified = true;
                  continue;
                }
              }
              newLines.push(line);
            }
            if (modified) {
              const newPaxPayload = Buffer.from(newLines.join("\n") + "\n", "utf-8");
              const header2 = Buffer.alloc(TAR_HEADER_SIZE);
              block.copy(header2);
              const newSizeStr = newPaxPayload.length.toString(8).padStart(11, "0") + "\0";
              Buffer.from(newSizeStr).copy(header2, 124);
              header2.fill(32, TAR_CHKSUM_OFFSET, TAR_CHKSUM_OFFSET + TAR_CHKSUM_SIZE);
              let sum = 0;
              for (let i = 0; i < TAR_HEADER_SIZE; i++) sum += header2[i];
              Buffer.from(sum.toString(8).padStart(6, "0") + "\0 ").copy(header2, TAR_CHKSUM_OFFSET);
              parts.push(header2);
              pos += TAR_HEADER_SIZE;
              const newBlocks = Math.ceil(newPaxPayload.length / TAR_HEADER_SIZE) * TAR_HEADER_SIZE;
              const padded = Buffer.alloc(newBlocks);
              newPaxPayload.copy(padded);
              parts.push(padded);
              pos += dataBlocks;
              continue;
            }
            parts.push(buf.subarray(pos, pos + totalBlocks));
            pos += totalBlocks;
            continue;
          }
          const header = Buffer.from(block);
          const nameBytes = header.subarray(TAR_NAME_OFFSET, TAR_NAME_OFFSET + TAR_NAME_SIZE);
          const prefixBytes = header.subarray(TAR_PREFIX_OFFSET, TAR_PREFIX_OFFSET + TAR_PREFIX_SIZE);
          const nameEnd = nameBytes.indexOf(0);
          const prefixEnd = prefixBytes.indexOf(0);
          const nameLen = nameEnd === -1 ? TAR_NAME_SIZE : nameEnd;
          const prefixLen = prefixEnd === -1 ? TAR_PREFIX_SIZE : prefixEnd;
          let fullPath;
          if (prefixLen > 0) {
            fullPath = Buffer.concat([prefixBytes.subarray(0, prefixLen), Buffer.from("/"), nameBytes.subarray(0, nameLen)]);
          } else {
            fullPath = nameBytes.subarray(0, nameLen);
          }
          const converted = convertPath(fullPath);
          if (!converted.equals(fullPath)) {
            header.fill(0, TAR_NAME_OFFSET, TAR_NAME_OFFSET + TAR_NAME_SIZE);
            header.fill(0, TAR_PREFIX_OFFSET, TAR_PREFIX_OFFSET + TAR_PREFIX_SIZE);
            if (converted.length <= TAR_NAME_SIZE) {
              converted.copy(header, TAR_NAME_OFFSET);
            } else {
              const str = converted.toString("utf-8");
              const ls = str.lastIndexOf("/");
              if (ls > 0 && ls < str.length - 1) {
                const pre = converted.subarray(0, ls);
                const nm = converted.subarray(ls + 1);
                if (pre.length <= TAR_PREFIX_SIZE && nm.length <= TAR_NAME_SIZE) {
                  pre.copy(header, TAR_PREFIX_OFFSET);
                  nm.copy(header, TAR_NAME_OFFSET);
                }
              }
            }
            const tmp = Buffer.from(header);
            tmp.fill(32, TAR_CHKSUM_OFFSET, TAR_CHKSUM_OFFSET + TAR_CHKSUM_SIZE);
            let sum = 0;
            for (let i = 0; i < TAR_HEADER_SIZE; i++) sum += tmp[i];
            Buffer.from(sum.toString(8).padStart(6, "0") + "\0 ").copy(header, TAR_CHKSUM_OFFSET);
          }
          parts.push(header);
          pos += TAR_HEADER_SIZE;
          skipBytes = dataBlocks;
        }
        remaining = pos < buf.length ? buf.subarray(pos) : Buffer.alloc(0);
        callback(null, parts.length > 0 ? Buffer.concat(parts) : void 0);
      },
      flush(callback) {
        callback(null, remaining.length > 0 ? remaining : void 0);
      }
    });
  }
  async download() {
    const { remotePath, localPath } = this.options;
    const platform = await this.getRemotePlatform();
    const normalizedRemotePath = this.normalizeRemotePath(remotePath, platform);
    fs__namespace.mkdirSync(localPath, { recursive: true });
    this.state.total = await this.getRemoteFolderSize(normalizedRemotePath, platform);
    const channel = await this.execStream(this.buildDownloadCommand(normalizedRemotePath, platform));
    this.activeChannel = channel;
    this.pauseTarget = channel;
    const closePromise = this.waitForChannelClose(channel);
    const progressStream = this.createProgressStream();
    const extractStream = this.tarAdapter.x({ cwd: localPath, strict: true });
    if (this.needsEncodingConversion()) {
      const encodingTransform = this.createTarEncodingTransform(this.encoding, "utf-8");
      await Promise.all([
        promises.pipeline(channel, progressStream, encodingTransform, extractStream),
        closePromise
      ]);
    } else {
      await Promise.all([
        promises.pipeline(channel, progressStream, extractStream),
        closePromise
      ]);
    }
  }
  async upload() {
    const { remotePath, localPath } = this.options;
    const localStats = fs__namespace.statSync(localPath);
    if (!localStats.isDirectory()) {
      throw new Error(`Local path is not a directory: ${localPath}`);
    }
    const platform = await this.getRemotePlatform();
    const normalizedRemotePath = this.normalizeRemotePath(remotePath, platform);
    this.state.total = await this.getLocalFolderSize(localPath);
    const channel = await this.execStream(this.buildUploadCommand(normalizedRemotePath, platform));
    this.activeChannel = channel;
    const closePromise = this.waitForChannelClose(channel);
    const packStream = this.tarAdapter.c({ cwd: localPath }, ["."]);
    this.pauseTarget = packStream;
    const progressStream = this.createProgressStream();
    const remoteStdin = this.getChannelWritable(channel);
    if (this.needsEncodingConversion()) {
      const encodingTransform = this.createTarEncodingTransform("utf-8", this.encoding);
      await Promise.all([
        promises.pipeline(packStream, progressStream, encodingTransform, remoteStdin),
        closePromise
      ]);
    } else {
      await Promise.all([
        promises.pipeline(packStream, progressStream, remoteStdin),
        closePromise
      ]);
    }
  }
  async getRemotePlatform() {
    if (!this.platformPromise) {
      this.platformPromise = this.runRemoteCommand("uname -s").then((output) => {
        const value = output.trim().toLowerCase();
        const platform = value.includes("windows") ? "windows" : "posix";
        return platform;
      }).catch(async () => {
        await this.runRemoteCommand(this.toPowerShellCommand("$PSVersionTable.PSVersion.ToString() | Out-String"));
        return "windows";
      });
    }
    return await this.platformPromise;
  }
  async getRemoteFolderSize(remotePath, platform) {
    const output = platform === "windows" ? await this.runRemoteCommand(this.toPowerShellCommand(`$sum=(Get-ChildItem -LiteralPath '${this.escapePowerShell(remotePath)}' -Recurse -Force | Where-Object { -not $_.PSIsContainer } | Measure-Object -Property Length -Sum).Sum; if ($null -eq $sum) { '0' } else { [int64]$sum }`)) : await this.runRemoteCommand(`find "${this.escapePosix(remotePath)}" -type f -exec stat -c %s {} + 2>/dev/null | awk '{s+=$1} END {print s+0}' || find "${this.escapePosix(remotePath)}" -type f -exec stat -f %z {} + 2>/dev/null | awk '{s+=$1} END {print s+0}'`);
    return parseInt(output.trim(), 10) || 0;
  }
  normalizeRemotePath(remotePath, platform) {
    if (platform !== "windows") {
      return remotePath;
    }
    const trimmedPath = remotePath.trim().replace(/\\/g, "/");
    return trimmedPath.replace(/^\/([A-Za-z]:(?:\/|$))/, "$1");
  }
  async getLocalFolderSize(localPath) {
    const stack = [localPath];
    let total = 0;
    while (stack.length > 0) {
      const currentPath = stack.pop();
      const entries = await fs__namespace.promises.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path__namespace.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          stack.push(entryPath);
          continue;
        }
        if (entry.isFile()) {
          const stats = await fs__namespace.promises.stat(entryPath);
          total += stats.size;
        }
      }
    }
    return total;
  }
  createProgressStream() {
    return new stream.Transform({
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
  buildDownloadCommand(remotePath, platform) {
    if (platform === "windows") {
      return this.toPowerShellCommand(`& { tar -cf - -C '${this.escapePowerShell(remotePath)}' . }`);
    }
    return `tar -cf - -C "${this.escapePosix(remotePath)}" .`;
  }
  buildUploadCommand(remotePath, platform) {
    if (platform === "windows") {
      return this.toPowerShellCommand(`& { New-Item -ItemType Directory -Force -Path '${this.escapePowerShell(remotePath)}' | Out-Null; tar -xf - -C '${this.escapePowerShell(remotePath)}' }`);
    }
    return `mkdir -p "${this.escapePosix(remotePath)}" && tar -xf - -C "${this.escapePosix(remotePath)}"`;
  }
  escapePosix(value) {
    return value.replace(/(["\\`$])/g, "\\$1");
  }
  escapePowerShell(value) {
    return value.replace(/'/g, "''");
  }
  toPowerShellCommand(script) {
    return `powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`;
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
  runExec(cmd) {
    return new Promise((resolve, reject) => {
      this.session.exec(cmd, (err, channel) => {
        if (err) {
          reject(err);
          return;
        }
        let stdout = "";
        let stderr = "";
        channel.on("data", (chunk) => {
          stdout += chunk.toString();
        });
        channel.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });
        channel.on("close", (code) => {
          if (code && code !== 0) {
            reject(new Error(stderr.trim() || `Command failed: ${cmd}`));
            return;
          }
          if (stderr.trim()) {
            reject(new Error(stderr.trim()));
            return;
          }
          resolve(stdout);
        });
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
exports.FolderTransfer = FolderTransfer;
