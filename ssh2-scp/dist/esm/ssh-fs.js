class SshFs {
  session;
  _chunkSize = null;
  iconv;
  encoding;
  async getChunkSize() {
    return this.detectChunkSize();
  }
  constructor(session, options) {
    this.session = session;
    this.iconv = options?.iconv;
    this.encoding = options?.encoding || "utf-8";
  }
  decodeBuffer(buf) {
    if (this.iconv) {
      return this.iconv.decode(buf, this.encoding);
    }
    return buf.toString();
  }
  async detectChunkSize() {
    this._chunkSize = 4 * 1024;
    return this._chunkSize;
  }
  getExecOpts() {
    return {};
  }
  maskMode(mode) {
    return mode & 4095;
  }
  getMonthIndex(month) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.indexOf(month);
  }
  runCmd(cmd, timeout = 3e4) {
    return new Promise((resolve, reject) => {
      let timeoutId;
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Command timed out: ${cmd}`));
      }, timeout);
      this.session.exec(cmd, (err, stream) => {
        cleanup();
        if (err) {
          reject(err);
        } else {
          let out = Buffer.from("");
          stream.on("end", () => {
            resolve(this.decodeBuffer(out));
          }).on("data", (data) => {
            out = Buffer.concat([out, data]);
          }).stderr.on("data", (data) => {
            reject(this.decodeBuffer(data));
          });
        }
      });
    });
  }
  rmFolderCmd(remotePath) {
    return this.runCmd(`rmdir "${remotePath}"`);
  }
  rmCmd(remotePath) {
    return this.runCmd(`rm "${remotePath}"`);
  }
  async getHomeDir() {
    return this.realpath(".");
  }
  async rmdir(remotePath) {
    try {
      return await this.rmrf(remotePath);
    } catch (err) {
      console.error("rm -rf dir error", err);
      return this.removeDirectoryRecursively(remotePath);
    }
  }
  async removeDirectoryRecursively(remotePath) {
    try {
      const contents = await this.listFiles(remotePath);
      for (const item of contents) {
        if (item.name === "." || item.name === "..") continue;
        const itemPath = `${remotePath}/${item.name}`;
        if (item.type === "d") {
          await this.removeDirectoryRecursively(itemPath);
        } else {
          await this.rmCmd(itemPath);
        }
      }
      await this.rmFolderCmd(remotePath);
    } catch (e) {
    }
  }
  rmrf(remotePath) {
    return this.runCmd(`rm -rf "${remotePath}"`);
  }
  touch(remotePath) {
    return this.runCmd(`touch "${remotePath}"`);
  }
  cp(from, to) {
    return new Promise((resolve, reject) => {
      const cmd = `cp -r "${from}" "${to}"`;
      this.session.exec(cmd, this.getExecOpts(), (err) => {
        if (err) reject(err);
        else resolve(1);
      });
    });
  }
  mv(from, to) {
    return new Promise((resolve, reject) => {
      const cmd = `mv "${from}" "${to}"`;
      this.session.exec(cmd, this.getExecOpts(), (err) => {
        if (err) reject(err);
        else resolve(1);
      });
    });
  }
  runExec(cmd) {
    return new Promise((resolve, reject) => {
      this.session.exec(cmd, this.getExecOpts(), (err, stream) => {
        if (err) {
          reject(err);
        } else {
          let out = Buffer.from("");
          stream.on("end", () => {
            resolve(this.decodeBuffer(out));
          }).on("data", (data) => {
            out = Buffer.concat([out, data]);
          }).stderr.on("data", (data) => {
            reject(this.decodeBuffer(data));
          });
        }
      });
    });
  }
  async getFolderSize(folderPath) {
    try {
      const output = await this.runCmd(`du -sh "${folderPath}"`);
      const size = output.trim().split("	")[0] || "0";
      return { size, count: 0 };
    } catch {
      return { size: "0", count: 0 };
    }
  }
  async listFiles(remotePath) {
    const output = await this.runCmd(`ls -la "${remotePath}"`);
    const lines = output.trim().split("\n");
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || i === 0) continue;
      const parts = line.split(/\s+/);
      if (parts.length < 9) continue;
      const type = parts[0].charAt(0);
      let name = parts.slice(8).join(" ");
      if (type === "l") {
        const arrow = name.indexOf(" -> ");
        if (arrow > 0) {
          name = name.slice(0, arrow);
        }
      }
      if (name === "." || name === "..") continue;
      const mode = parseModeFromLongname(parts[0]);
      const owner = parseInt(parts[2], 10);
      const group = parseInt(parts[3], 10);
      const size = parseInt(parts[4], 10);
      const month = parts[5];
      const day = parts[6];
      const timeOrYear = parts[7];
      let mtime = 0;
      const now = /* @__PURE__ */ new Date();
      const year = now.getFullYear();
      if (timeOrYear.includes(":")) {
        const [hour, minute] = timeOrYear.split(":").map(Number);
        mtime = new Date(year, this.getMonthIndex(month), parseInt(day, 10), hour, minute).getTime();
      } else {
        mtime = new Date(parseInt(timeOrYear, 10), this.getMonthIndex(month), parseInt(day, 10)).getTime();
      }
      result.push({
        type,
        name,
        size,
        modifyTime: mtime,
        accessTime: mtime,
        mode,
        rights: {
          user: parts[0].substring(1, 4),
          group: parts[0].substring(4, 7),
          other: parts[0].substring(7, 10)
        },
        owner,
        group
      });
    }
    return result;
  }
  list(remotePath) {
    return this.listFiles(remotePath);
  }
  async mkdir(remotePath, options = {}) {
    const cmd = options.mode ? `mkdir -m ${this.maskMode(options.mode).toString(8)} -p "${remotePath}"` : `mkdir -p "${remotePath}"`;
    return this.runCmd(cmd);
  }
  async stat(remotePath) {
    const isSymlink = await this.runCmd(`test -L "${remotePath}" && echo 1 || echo 0`).then((r) => r.trim() === "1");
    const output = await this.runCmd(`ls -la "${remotePath}"`);
    const parts = output.trim().split(/\s+/);
    if (parts.length < 9) {
      return {
        size: 0,
        mode: 0,
        uid: 0,
        gid: 0,
        atime: 0,
        mtime: 0,
        isFile: () => false,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isFIFO: () => false,
        isSocket: () => false
      };
    }
    const size = parseInt(parts[4], 10);
    const modeStr = parts[0];
    const mode = parseModeFromLongname(modeStr);
    const uid = parseInt(parts[2], 10);
    const gid = parseInt(parts[3], 10);
    return {
      size,
      mode,
      uid,
      gid,
      atime: 0,
      mtime: 0,
      isFile: () => modeStr.startsWith("-"),
      isDirectory: () => modeStr.startsWith("d"),
      isSymbolicLink: () => isSymlink,
      isBlockDevice: () => modeStr.startsWith("b"),
      isCharacterDevice: () => modeStr.startsWith("c"),
      isFIFO: () => modeStr.startsWith("p"),
      isSocket: () => modeStr.startsWith("s")
    };
  }
  readlink(remotePath) {
    return this.runCmd(`readlink "${remotePath}"`).then((output) => output.trim());
  }
  realpath(remotePath) {
    return this.runCmd(`readlink -f "${remotePath}"`).then((output) => output.trim()).catch(() => this.runCmd(`cd "${remotePath}" && pwd`).then((output) => output.trim()));
  }
  async lstat(remotePath) {
    const output = await this.runCmd(`ls -ld "${remotePath}"`);
    const isSymlink = output.trim().startsWith("l");
    const lsOutput = await this.runCmd(`ls -la "${remotePath}"`);
    const parts = lsOutput.trim().split(/\s+/);
    if (parts.length < 9) {
      return {
        size: 0,
        mode: 0,
        uid: 0,
        gid: 0,
        atime: 0,
        mtime: 0,
        isFile: () => false,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isFIFO: () => false,
        isSocket: () => false
      };
    }
    const size = parseInt(parts[4], 10);
    const modeStr = parts[0];
    const mode = parseModeFromLongname(modeStr);
    const uid = parseInt(parts[2], 10);
    const gid = parseInt(parts[3], 10);
    return {
      size,
      mode,
      uid,
      gid,
      atime: 0,
      mtime: 0,
      isFile: () => !isSymlink && modeStr.startsWith("-"),
      isDirectory: () => !isSymlink && modeStr.startsWith("d"),
      isSymbolicLink: () => isSymlink,
      isBlockDevice: () => modeStr.startsWith("b"),
      isCharacterDevice: () => modeStr.startsWith("c"),
      isFIFO: () => modeStr.startsWith("p"),
      isSocket: () => modeStr.startsWith("s")
    };
  }
  chmod(remotePath, mode) {
    return this.runCmd(`chmod ${this.maskMode(mode).toString(8)} "${remotePath}"`);
  }
  rename(remotePath, remotePathNew) {
    return this.runCmd(`mv "${remotePath}" "${remotePathNew}"`);
  }
  rmFolder(remotePath) {
    return this.rmFolderCmd(remotePath);
  }
  rm(remotePath) {
    return this.rmCmd(remotePath);
  }
  async readFile(remotePath, options) {
    const defaultChunkSize = await this.detectChunkSize();
    const chunkSize = options?.chunkSize ?? defaultChunkSize;
    const lsOutput = await this.runCmd(`ls -la "${remotePath}"`);
    const parts = lsOutput.trim().split(/\s+/);
    const fileSize = parts.length >= 5 ? parseInt(parts[4], 10) : 0;
    if (fileSize <= chunkSize) {
      const output = await this.runCmd(`cat "${remotePath}"`);
      return output;
    }
    const chunks = [];
    for (let offset = 0; offset < fileSize; offset += chunkSize) {
      try {
        const cmd = `dd if="${remotePath}" bs=1K skip=${Math.floor(offset / 1024)} count=${Math.ceil(chunkSize / 1024)} 2>/dev/null`;
        const chunkOutput = await this.runCmd(cmd);
        if (chunkOutput) {
          chunks.push(chunkOutput);
        }
      } catch {
        return this.runCmd(`cat "${remotePath}"`);
      }
    }
    return chunks.join("");
  }
  async writeFile(remotePath, str, mode, _options) {
    const defaultChunkSize = await this.detectChunkSize();
    const data = Buffer.from(str);
    const sizeThreshold = defaultChunkSize;
    if (data.length <= sizeThreshold) {
      const escapedContent = str.replace(/'/g, "'\\''");
      const cmd = `printf '%s' '${escapedContent}' > "${remotePath}"`;
      await this.runCmd(cmd);
    } else {
      const tempBase = `/tmp/ssh-fs-${Date.now()}`;
      await this.runCmd(`mkdir -p "${tempBase}"`);
      try {
        const chunkSize = defaultChunkSize;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          const chunkFile = `${tempBase}/c${Math.floor(i / chunkSize)}`;
          const escapedChunk = chunk.toString("binary").replace(/'/g, "'\\''");
          await this.runCmd(`printf '%s' '${escapedChunk}' > "${chunkFile}"`);
        }
        await this.runCmd(`cat ${tempBase}/c* > "${remotePath}"`);
      } finally {
        await this.runCmd(`rm -rf "${tempBase}"`);
      }
    }
    if (mode) {
      await this.runCmd(`chmod ${this.maskMode(mode).toString(8)} "${remotePath}"`);
    }
  }
}
function createSshFs(session, options) {
  return new SshFs(session, options);
}
function parseModeFromLongname(longname) {
  if (!longname || longname.length < 10) return 0;
  const typeMap = {
    "-": 32768,
    d: 16384,
    l: 40960,
    c: 8192,
    b: 24576,
    p: 4096,
    s: 49152
  };
  const typeBits = typeMap[longname[0]] || 32768;
  const permValues = [256, 128, 64, 32, 16, 8, 4, 2, 1];
  let permBits = 0;
  for (let i = 0; i < 9; i++) {
    if (longname[i + 1] !== "-") {
      permBits |= permValues[i];
    }
  }
  return typeBits | permBits;
}
export {
  SshFs,
  createSshFs,
  parseModeFromLongname
};
