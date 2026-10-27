import { Md5 } from "ts-md5";
import { TrzszBuffer } from "./buffer.js";
import { escapeData, unescapeData, escapeCharsToCodes } from "./escape.js";
import { TrzszError, stripTmuxStatusLine, encodeBuffer, strToUtf8, uint8ToStr, decodeBuffer, trzszVersion, TmuxMode } from "./comm.js";
class TrzszTransfer {
  /**
   * Create a TrzszTransfer.
   * @param writer - The output writer function.
   * @param isWindowsShell - Whether the shell is Windows.
   */
  constructor(writer, isWindowsShell = false) {
    this.buffer = new TrzszBuffer();
    this.remoteIsWindows = false;
    this.lastInputTime = 0;
    this.openedFiles = [];
    this.createdFiles = [];
    this.tmuxOutputJunk = false;
    this.cleanTimeoutInMilliseconds = 100;
    this.transferConfig = {};
    this.stopped = false;
    this.maxChunkTimeInMilliseconds = 0;
    this.protocolNewline = "\n";
    this.writer = writer;
    this.isWindowsShell = isWindowsShell;
  }
  /**
   * Cleanup resources.
   */
  cleanup() {
    for (const file of this.openedFiles) {
      file.closeFile();
    }
  }
  /**
   * Add received data to the buffer.
   * @param data - The received data.
   */
  addReceivedData(data) {
    if (!this.stopped) {
      this.buffer.addBuffer(data);
    }
    this.lastInputTime = Date.now();
  }
  /**
   * Stop transferring.
   */
  async stopTransferring() {
    this.cleanTimeoutInMilliseconds = Math.max(this.maxChunkTimeInMilliseconds * 2, 500);
    this.stopped = true;
    this.buffer.stopBuffer();
  }
  /**
   * Clean input buffer.
   * @param timeoutInMilliseconds - The timeout in milliseconds.
   */
  async cleanInput(timeoutInMilliseconds) {
    this.stopped = true;
    this.buffer.drainBuffer();
    this.lastInputTime = Date.now();
    while (true) {
      const sleepTime = timeoutInMilliseconds - (Date.now() - this.lastInputTime);
      if (sleepTime <= 0) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }
  }
  /**
   * Send a line.
   * @param typ - The type.
   * @param buf - The buffer.
   */
  async sendLine(typ, buf) {
    this.writer(`#${typ}:${buf}${this.protocolNewline}`);
  }
  /**
   * Receive a line.
   * @param expectType - The expected type.
   * @param mayHasJunk - Whether there may be junk.
   */
  async recvLine(expectType, mayHasJunk = false) {
    if (this.stopped) {
      throw new TrzszError("Stopped");
    }
    if (this.isWindowsShell || this.remoteIsWindows) {
      let line2 = await this.buffer.readLineOnWindows();
      const idx = line2.lastIndexOf("#" + expectType + ":");
      if (idx >= 0) {
        line2 = line2.substring(idx);
      } else {
        const idx2 = line2.lastIndexOf("#");
        if (idx2 > 0) {
          line2 = line2.substring(idx2);
        }
      }
      return line2;
    }
    let line = await this.buffer.readLine();
    if (this.tmuxOutputJunk || mayHasJunk) {
      if (line.length > 0) {
        while (line[line.length - 1] === "\r") {
          line = line.substring(0, line.length - 1) + await this.buffer.readLine();
        }
      }
      const idx = line.lastIndexOf("#" + expectType + ":");
      if (idx >= 0) {
        line = line.substring(idx);
      } else {
        const idx2 = line.lastIndexOf("#");
        if (idx2 > 0) {
          line = line.substring(idx2);
        }
      }
      line = stripTmuxStatusLine(line);
    }
    return line;
  }
  /**
   * Receive and check a line.
   * @param expectType - The expected type.
   * @param mayHasJunk - Whether there may be junk.
   */
  async recvCheck(expectType, mayHasJunk = false) {
    const line = await this.recvLine(expectType, mayHasJunk);
    const idx = line.indexOf(":");
    if (idx < 1) {
      throw new TrzszError(encodeBuffer(line), "colon", true);
    }
    const typ = line.substring(1, idx);
    const buf = line.substring(idx + 1);
    if (typ !== expectType) {
      throw new TrzszError(buf, typ, true);
    }
    return buf;
  }
  /**
   * Send an integer.
   * @param typ - The type.
   * @param val - The value.
   */
  async sendInteger(typ, val) {
    await this.sendLine(typ, val.toString());
  }
  /**
   * Receive an integer.
   * @param typ - The type.
   * @param mayHasJunk - Whether there may be junk.
   */
  async recvInteger(typ, mayHasJunk = false) {
    const buf = await this.recvCheck(typ, mayHasJunk);
    return Number(buf);
  }
  /**
   * Check an integer.
   * @param expect - The expected value.
   */
  async checkInteger(expect) {
    const result = await this.recvInteger("SUCC");
    if (result !== expect) {
      throw new TrzszError(`Integer check [${result}] <> [${expect}]`, null, true);
    }
  }
  /**
   * Send a string.
   * @param typ - The type.
   * @param str - The string.
   */
  async sendString(typ, str) {
    await this.sendLine(typ, encodeBuffer(strToUtf8(str)));
  }
  /**
   * Receive a string.
   * @param typ - The type.
   * @param mayHasJunk - Whether there may be junk.
   */
  async recvString(typ, mayHasJunk = false) {
    const buf = await this.recvCheck(typ, mayHasJunk);
    return await uint8ToStr(decodeBuffer(buf), "utf8");
  }
  /**
   * Check a string.
   * @param expect - The expected string.
   */
  async checkString(expect) {
    const result = await this.recvString("SUCC");
    if (result !== expect) {
      throw new TrzszError(`String check [${result}] <> [${expect}]`, null, true);
    }
  }
  /**
   * Send binary data.
   * @param typ - The type.
   * @param buf - The buffer.
   */
  async sendBinary(typ, buf) {
    await this.sendLine(typ, encodeBuffer(buf));
  }
  /**
   * Receive binary data.
   * @param typ - The type.
   * @param mayHasJunk - Whether there may be junk.
   */
  async recvBinary(typ, mayHasJunk = false) {
    const buf = await this.recvCheck(typ, mayHasJunk);
    return decodeBuffer(buf);
  }
  /**
   * Check binary data.
   * @param expect - The expected buffer.
   */
  async checkBinary(expect) {
    const result = await this.recvBinary("SUCC");
    if (result.length !== expect.length) {
      throw new TrzszError(
        `Binary length check [${result.length}] <> [${expect.length}]`,
        null,
        true
      );
    }
    for (let i = 0; i < result.length; i++) {
      if (result[i] !== expect[i]) {
        throw new TrzszError(`Binary check [${result[i]}] <> [${expect[i]}]`, null, true);
      }
    }
  }
  /**
   * Send data.
   * @param data - The data.
   * @param binary - Whether to use binary mode.
   * @param escapeCodes - The escape codes.
   */
  async sendData(data, binary, escapeCodes) {
    if (!binary) {
      await this.sendBinary("DATA", data);
      return;
    }
    const buf = escapeData(data, escapeCodes);
    this.writer(`#DATA:${buf.length}
`);
    this.writer(buf);
  }
  /**
   * Receive data.
   * @param binary - Whether to use binary mode.
   * @param escapeCodes - The escape codes.
   * @param timeoutInMilliseconds - The timeout in milliseconds.
   */
  async recvData(binary, escapeCodes, timeoutInMilliseconds) {
    return await Promise.race([
      new Promise(
        (_resolve, reject) => setTimeout(() => {
          this.cleanTimeoutInMilliseconds = 3e3;
          reject(new TrzszError("Receive data timeout"));
        }, timeoutInMilliseconds)
      ),
      (async () => {
        if (!binary) {
          return await this.recvBinary("DATA");
        }
        const size = await this.recvInteger("DATA");
        const data = await this.buffer.readBinary(size);
        return unescapeData(data, escapeCodes);
      })()
    ]);
  }
  /**
   * Send action.
   * @param confirm - Whether to confirm.
   * @param remoteIsWindows - Whether the remote is Windows.
   */
  async sendAction(confirm, remoteIsWindows) {
    const action = {
      lang: "js",
      confirm,
      version: trzszVersion,
      support_dir: true
    };
    if (this.isWindowsShell || remoteIsWindows) {
      action.binary = false;
      action.newline = "!\n";
    }
    if (remoteIsWindows) {
      this.remoteIsWindows = true;
      this.protocolNewline = "!\n";
    }
    await this.sendString("ACT", JSON.stringify(action));
  }
  /**
   * Receive action.
   */
  async recvAction() {
    const buf = await this.recvString("ACT", true);
    const action = JSON.parse(buf);
    const newline = action.newline;
    if (typeof newline === "string" && newline.length > 0) {
      this.protocolNewline = newline;
    }
    return action;
  }
  /**
   * Send config.
   * @param args - The config arguments.
   * @param escapeChars - The escape characters.
   * @param tmuxMode - The tmux mode.
   * @param tmuxPaneWidth - The tmux pane width.
   */
  async sendConfig(args, escapeChars, tmuxMode, tmuxPaneWidth) {
    const config = { lang: "js" };
    if (args.quiet === true) {
      config.quiet = true;
    }
    if (args.binary === true) {
      config.binary = true;
      config.escape_chars = escapeChars;
    }
    if (args.directory === true) {
      config.directory = true;
    }
    if (typeof args.bufsize === "number") {
      config.bufsize = args.bufsize;
    }
    if (typeof args.timeout === "number") {
      config.timeout = args.timeout;
    }
    if (args.overwrite === true) {
      config.overwrite = true;
    }
    if (tmuxMode === TmuxMode.TmuxNormalMode) {
      config.tmux_output_junk = true;
    }
    if (tmuxPaneWidth > 0) {
      config.tmux_pane_width = tmuxPaneWidth;
    }
    let jsonStr = JSON.stringify(config);
    jsonStr = jsonStr.replace(/[\u007F-\uFFFF]/g, function(chr) {
      return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).slice(-4);
    });
    this.transferConfig = config;
    await this.sendString("CFG", jsonStr);
  }
  /**
   * Receive config.
   */
  async recvConfig() {
    const buf = await this.recvString("CFG", true);
    this.transferConfig = JSON.parse(buf);
    this.tmuxOutputJunk = this.transferConfig.tmux_output_junk === true;
    return this.transferConfig;
  }
  /**
   * Send client exit.
   * @param msg - The message.
   */
  async clientExit(msg) {
    await this.sendString("EXIT", msg);
  }
  /**
   * Receive exit.
   */
  async recvExit() {
    return await this.recvString("EXIT");
  }
  /**
   * Delete created files.
   */
  async deleteCreatedFiles() {
    const deletedFiles = [];
    for (const file of this.createdFiles) {
      const path = await file.deleteFile();
      if (typeof path === "string" && path.length > 0) {
        deletedFiles.push(path);
      }
    }
    return deletedFiles;
  }
  /**
   * Handle client error.
   * @param err - The error.
   */
  async clientError(err) {
    await this.cleanInput(this.cleanTimeoutInMilliseconds);
    const errMsg = TrzszError.getErrorMessage(err);
    let trace = true;
    if (err instanceof TrzszError) {
      trace = err.isTraceBack();
      if (err.isRemoteExit()) {
        return;
      }
      if (err.isRemoteFail()) {
        if (trace) {
          console.log(errMsg);
        }
        return;
      }
    }
    await this.sendString(trace ? "FAIL" : "fail", errMsg);
    if (trace) {
      console.log(errMsg);
    }
  }
  /**
   * Handle server error.
   * @param err - The error.
   */
  async serverError(err) {
    await this.cleanInput(this.cleanTimeoutInMilliseconds);
    const errMsg = TrzszError.getErrorMessage(err);
    let trace = true;
    if (err instanceof TrzszError) {
      if (err.isStopAndDelete()) {
        const deletedFiles = await this.deleteCreatedFiles();
        if (deletedFiles.length > 0) {
          await this.serverExit([err.message + ":"].concat(deletedFiles).join("\r\n- "));
          return;
        }
      }
      trace = err.isTraceBack();
      if (err.isRemoteExit() || err.isRemoteFail()) {
        await this.serverExit(errMsg);
        return;
      }
    }
    await this.sendString(trace ? "FAIL" : "fail", errMsg);
    await this.serverExit(errMsg);
  }
  /**
   * Server exit - to be implemented by subclass or user.
   * @param msg - The message.
   */
  async serverExit(_msg) {
  }
  /**
   * Send file number.
   * @param num - The number of files.
   * @param progressCallback - The progress callback.
   */
  async sendFileNum(num, progressCallback) {
    await this.sendInteger("NUM", num);
    await this.checkInteger(num);
    if (progressCallback != null) {
      progressCallback.onNum(num);
    }
  }
  /**
   * Send file name.
   * @param file - The file reader.
   * @param directory - Whether it's a directory.
   * @param progressCallback - The progress callback.
   */
  async sendFileName(file, directory, progressCallback) {
    const relPath = file.getRelPath();
    const fileName = relPath[relPath.length - 1];
    if (directory) {
      const jsonName = {
        path_id: file.getPathId(),
        path_name: relPath,
        is_dir: file.isDir()
      };
      await this.sendString("NAME", JSON.stringify(jsonName));
    } else {
      await this.sendString("NAME", fileName);
    }
    const remoteName = await this.recvString("SUCC");
    if (progressCallback != null) {
      progressCallback.onName(fileName);
    }
    return remoteName;
  }
  /**
   * Send file size.
   * @param size - The file size.
   * @param progressCallback - The progress callback.
   */
  async sendFileSize(size, progressCallback) {
    await this.sendInteger("SIZE", size);
    await this.checkInteger(size);
    if (progressCallback != null) {
      progressCallback.onSize(size);
    }
  }
  /**
   * Send file data.
   * @param file - The file reader.
   * @param size - The file size.
   * @param binary - Whether to use binary mode.
   * @param escapeCodes - The escape codes.
   * @param maxBufSize - The maximum buffer size.
   * @param progressCallback - The progress callback.
   */
  async sendFileData(file, size, binary, escapeCodes, maxBufSize, progressCallback) {
    let step = 0;
    if (progressCallback != null) {
      progressCallback.onStep(step);
    }
    let bufSize = 1024;
    let buffer = new ArrayBuffer(bufSize);
    const md5 = new Md5();
    while (step < size) {
      const beginTime = Date.now();
      const data = await file.readFile(buffer);
      await this.sendData(data, binary, escapeCodes);
      md5.appendByteArray(data);
      await this.checkInteger(data.length);
      step += data.length;
      if (progressCallback != null) {
        progressCallback.onStep(step);
      }
      const chunkTime = Date.now() - beginTime;
      if (data.length === bufSize && chunkTime < 500 && bufSize < maxBufSize) {
        bufSize = Math.min(bufSize * 2, maxBufSize);
        buffer = new ArrayBuffer(bufSize);
      } else if (chunkTime >= 2e3 && bufSize > 1024) {
        bufSize = 1024;
        buffer = new ArrayBuffer(bufSize);
      }
      if (chunkTime > this.maxChunkTimeInMilliseconds) {
        this.maxChunkTimeInMilliseconds = chunkTime;
      }
    }
    return new Uint8Array(md5.end(true).buffer);
  }
  /**
   * Send file MD5.
   * @param digest - The MD5 digest.
   * @param progressCallback - The progress callback.
   */
  async sendFileMD5(digest, progressCallback) {
    await this.sendBinary("MD5", digest);
    await this.checkBinary(digest);
    if (progressCallback != null) {
      progressCallback.onDone();
    }
  }
  /**
   * Send files.
   * @param files - The file readers.
   * @param progressCallback - The progress callback.
   */
  async sendFiles(files, progressCallback) {
    this.openedFiles.push(...files);
    const binary = this.transferConfig.binary === true;
    const directory = this.transferConfig.directory === true;
    const bufsizeVal = this.transferConfig.bufsize;
    const maxBufSize = typeof bufsizeVal === "number" ? bufsizeVal : 10 * 1024 * 1024;
    const escapeCodes = Array.isArray(this.transferConfig.escape_chars) ? escapeCharsToCodes(this.transferConfig.escape_chars) : [];
    await this.sendFileNum(files.length, progressCallback);
    const remoteNames = [];
    for (const file of files) {
      const remoteName = await this.sendFileName(file, directory, progressCallback);
      if (!remoteNames.includes(remoteName)) {
        remoteNames.push(remoteName);
      }
      if (file.isDir()) {
        continue;
      }
      const size = file.getSize();
      await this.sendFileSize(size, progressCallback);
      const digest = await this.sendFileData(file, size, binary, escapeCodes, maxBufSize, progressCallback);
      file.closeFile();
      await this.sendFileMD5(digest, progressCallback);
    }
    return remoteNames;
  }
  /**
   * Receive file number.
   * @param progressCallback - The progress callback.
   */
  async recvFileNum(progressCallback) {
    const num = await this.recvInteger("NUM");
    await this.sendInteger("SUCC", num);
    if (progressCallback != null) {
      progressCallback.onNum(num);
    }
    return num;
  }
  /**
   * Receive file name.
   * @param saveParam - The save parameter.
   * @param openSaveFile - The open save file function.
   * @param directory - Whether it's a directory.
   * @param overwrite - Whether to overwrite.
   * @param progressCallback - The progress callback.
   */
  async recvFileName(saveParam, openSaveFile, directory, overwrite, progressCallback) {
    const fileName = await this.recvString("NAME");
    const file = await openSaveFile(saveParam, fileName, directory, overwrite);
    this.createdFiles.push(file);
    await this.sendString("SUCC", file.getLocalName());
    if (progressCallback != null) {
      progressCallback.onName(file.getFileName());
    }
    return file;
  }
  /**
   * Receive file size.
   * @param progressCallback - The progress callback.
   */
  async recvFileSize(progressCallback) {
    const fileSize = await this.recvInteger("SIZE");
    await this.sendInteger("SUCC", fileSize);
    if (progressCallback != null) {
      progressCallback.onSize(fileSize);
    }
    return fileSize;
  }
  /**
   * Receive file data.
   * @param file - The file writer.
   * @param size - The file size.
   * @param binary - Whether to use binary mode.
   * @param escapeCodes - The escape codes.
   * @param timeoutInMilliseconds - The timeout in milliseconds.
   * @param progressCallback - The progress callback.
   */
  async recvFileData(file, size, binary, escapeCodes, timeoutInMilliseconds, progressCallback) {
    let step = 0;
    if (progressCallback != null) {
      progressCallback.onStep(step);
    }
    const md5 = new Md5();
    while (step < size) {
      const beginTime = Date.now();
      const data = await this.recvData(binary, escapeCodes, timeoutInMilliseconds);
      await file.writeFile(data);
      step += data.length;
      if (progressCallback != null) {
        progressCallback.onStep(step);
      }
      await this.sendInteger("SUCC", data.length);
      md5.appendByteArray(data);
      const chunkTime = Date.now() - beginTime;
      if (chunkTime > this.maxChunkTimeInMilliseconds) {
        this.maxChunkTimeInMilliseconds = chunkTime;
      }
    }
    return new Uint8Array(md5.end(true).buffer);
  }
  /**
   * Receive file MD5.
   * @param digest - The MD5 digest.
   * @param progressCallback - The progress callback.
   */
  async recvFileMD5(digest, progressCallback) {
    const expectDigest = await this.recvBinary("MD5");
    if (digest.length !== expectDigest.length) {
      throw new TrzszError("Check MD5 failed");
    }
    for (let j = 0; j < digest.length; j++) {
      if (digest[j] !== expectDigest[j]) {
        throw new TrzszError("Check MD5 failed");
      }
    }
    await this.sendBinary("SUCC", digest);
    if (progressCallback != null) {
      progressCallback.onDone();
    }
  }
  /**
   * Receive files.
   * @param saveParam - The save parameter.
   * @param openSaveFile - The open save file function.
   * @param progressCallback - The progress callback.
   */
  async recvFiles(saveParam, openSaveFile, progressCallback) {
    const binary = this.transferConfig.binary === true;
    const directory = this.transferConfig.directory === true;
    const overwrite = this.transferConfig.overwrite === true;
    const timeoutVal = this.transferConfig.timeout;
    const timeoutInMilliseconds = typeof timeoutVal === "number" ? timeoutVal * 1e3 : 1e5;
    const escapeCodes = Array.isArray(this.transferConfig.escape_chars) ? escapeCharsToCodes(this.transferConfig.escape_chars) : [];
    const num = await this.recvFileNum(progressCallback);
    const localNames = [];
    for (let i = 0; i < num; i++) {
      const file = await this.recvFileName(
        saveParam,
        openSaveFile,
        directory,
        overwrite,
        progressCallback
      );
      if (!localNames.includes(file.getLocalName())) {
        localNames.push(file.getLocalName());
      }
      if (file.isDir()) {
        continue;
      }
      this.openedFiles.push(file);
      const size = await this.recvFileSize(progressCallback);
      const digest = await this.recvFileData(
        file,
        size,
        binary,
        escapeCodes,
        timeoutInMilliseconds,
        progressCallback
      );
      file.closeFile();
      await this.recvFileMD5(digest, progressCallback);
    }
    return localNames;
  }
}
export {
  TrzszTransfer
};
//# sourceMappingURL=transfer.js.map
