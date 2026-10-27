"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const Pako = require("pako");
const tsMd5 = require("ts-md5");
const trzszVersion = "2.0.0";
function strToUint8(str) {
  return Uint8Array.from(str, (v) => v.charCodeAt(0));
}
function strToUtf8(str) {
  return new TextEncoder().encode(str);
}
async function uint8ToStr(buf, encoding = "binary") {
  if (typeof Buffer === "function") {
    return Buffer.from(buf).toString(encoding);
  }
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    const arrayBuffer = new ArrayBuffer(buf.byteLength);
    new Uint8Array(arrayBuffer).set(buf);
    const blob = new Blob([arrayBuffer]);
    if (encoding === "binary") {
      reader.readAsBinaryString(blob);
    } else {
      reader.readAsText(blob, encoding);
    }
  });
}
function strToArrBuf(str) {
  const arr = strToUint8(str);
  const buffer = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buffer).set(arr);
  return buffer;
}
const _hasBuffer = typeof Buffer === "function";
let _nodeZlib;
function getNodeZlib() {
  if (_nodeZlib === void 0) {
    try {
      _nodeZlib = require("zlib");
    } catch {
      _nodeZlib = null;
    }
  }
  return _nodeZlib ?? null;
}
function uint8ToBase64(buffer) {
  if (_hasBuffer) {
    return Buffer.from(buffer).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}
function base64ToUint8(base64) {
  if (_hasBuffer) {
    return Buffer.from(base64, "base64");
  }
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}
function deflate(data) {
  const input = typeof data === "string" ? strToUint8(data) : data;
  const zlib = getNodeZlib();
  if (zlib != null) {
    const result = zlib.deflateSync(input);
    return new Uint8Array(result);
  }
  return Pako.deflate(input);
}
function inflate(data) {
  const zlib = getNodeZlib();
  if (zlib != null) {
    const result = zlib.inflateSync(data);
    return new Uint8Array(result);
  }
  return Pako.inflate(data);
}
function encodeBuffer(buf) {
  const buffer = deflate(buf);
  return uint8ToBase64(buffer);
}
function decodeBuffer(buf) {
  const buffer = base64ToUint8(buf);
  return inflate(buffer);
}
class TrzszError extends Error {
  constructor(message, type = null, trace = false) {
    if (type === "fail" || type === "FAIL" || type === "EXIT") {
      try {
        message = new TextDecoder().decode(decodeBuffer(message));
      } catch {
        message = `decode [${message}] error`;
      }
    } else if (type !== null) {
      message = `[TrzszError] ${type}: ${message}`;
    }
    super(message);
    Object.setPrototypeOf(this, TrzszError.prototype);
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, TrzszError);
    }
    this.name = "TrzszError";
    this.type = type;
    this.trace = trace;
  }
  /**
   * Check if the error should include traceback.
   * @return {boolean} True if traceback should be included.
   */
  isTraceBack() {
    if (this.type === "fail" || this.type === "EXIT") {
      return false;
    }
    return this.trace;
  }
  /**
   * Check if the error is a remote exit.
   * @return {boolean} True if remote exit.
   */
  isRemoteExit() {
    return this.type === "EXIT";
  }
  /**
   * Check if the error is a remote failure.
   * @return {boolean} True if remote failure.
   */
  isRemoteFail() {
    return this.type === "fail" || this.type === "FAIL";
  }
  /**
   * Check if the error indicates stop and delete.
   * @return {boolean} True if stop and delete.
   */
  isStopAndDelete() {
    if (this.type !== "fail") {
      return false;
    }
    return this.message === "Stopped and deleted";
  }
  /**
   * Get the error message.
   * @param {Error} err - The error object.
   * @return {string} The error message.
   */
  static getErrorMessage(err) {
    if (err instanceof TrzszError && !err.isTraceBack()) {
      return err.message;
    }
    if (typeof err.stack === "string" && err.stack.length > 0) {
      return err.stack.replace("TrzszError: ", "");
    }
    return err.toString();
  }
}
function checkDuplicateNames(files) {
  const names = /* @__PURE__ */ new Set();
  for (const file of files) {
    const path = file.getRelPath().join("/");
    if (names.has(path)) {
      throw new TrzszError(`Duplicate name: ${path}`);
    }
    names.add(path);
  }
}
function isArrayOfType(arr, type) {
  if (!Array.isArray(arr)) {
    return false;
  }
  for (const a of arr) {
    switch (type) {
      case "string":
        if (typeof a !== "string") return false;
        break;
      case "number":
        if (typeof a !== "number") return false;
        break;
      case "boolean":
        if (typeof a !== "boolean") return false;
        break;
      case "object":
        if (typeof a !== "object") return false;
        break;
      case "function":
        if (typeof a !== "function") return false;
        break;
      case "undefined":
        if (typeof a !== "undefined") return false;
        break;
      default:
        return false;
    }
  }
  return true;
}
function isVT100End(c) {
  if (c >= 97 && c <= 122) {
    return true;
  }
  if (c >= 65 && c <= 90) {
    return true;
  }
  return false;
}
function stripServerOutput(output) {
  let uint8;
  if (typeof output === "string") {
    uint8 = strToUint8(output);
  } else if (output instanceof ArrayBuffer) {
    uint8 = new Uint8Array(output);
  } else if (output instanceof Uint8Array) {
    uint8 = output;
  } else {
    return output;
  }
  const buf = new Uint8Array(uint8.length);
  let skipVT100 = false;
  let idx = 0;
  for (let i = 0; i < uint8.length; i++) {
    const c = uint8[i];
    if (skipVT100) {
      if (isVT100End(c)) {
        skipVT100 = false;
      }
    } else if (c === 27) {
      skipVT100 = true;
    } else {
      buf[idx++] = c;
    }
  }
  while (idx > 0) {
    const c = buf[idx - 1];
    if (c !== 13 && c !== 10) {
      break;
    }
    idx--;
  }
  const result = buf.subarray(0, idx);
  if (result.length > 100) {
    return output;
  }
  return String.fromCharCode.apply(null, Array.from(result));
}
const TmuxMode = {
  NoTmux: 0,
  TmuxNormalMode: 1,
  TmuxControlMode: 2
};
function formatSavedFiles(fileNames, destPath) {
  let msg = `Saved ${fileNames.length} ${fileNames.length > 1 ? "files/directories" : "file/directory"}`;
  if (destPath.length > 0) {
    msg += ` to ${destPath}`;
  }
  return [msg].concat(fileNames).join("\r\n- ");
}
function stripTmuxStatusLine(buf) {
  while (true) {
    const beginIdx = buf.indexOf("\x1BP=");
    if (beginIdx < 0) {
      return buf;
    }
    let bufIdx = beginIdx + 3;
    const midIdx = buf.substring(bufIdx).indexOf("\x1BP=");
    if (midIdx < 0) {
      return buf.substring(0, beginIdx);
    }
    bufIdx += midIdx + 3;
    const endIdx = buf.substring(bufIdx).indexOf("\x1B\\");
    if (endIdx < 0) {
      return buf.substring(0, beginIdx);
    }
    bufIdx += endIdx + 2;
    buf = buf.substring(0, beginIdx) + buf.substring(bufIdx);
  }
}
function isTrzszLetter(c) {
  if (c >= 97 && c <= 122) {
    return true;
  }
  if (c >= 65 && c <= 90) {
    return true;
  }
  if (c >= 48 && c <= 57) {
    return true;
  }
  if (c === 35 || c === 58 || c === 43 || c === 47 || c === 61) {
    return true;
  }
  return false;
}
class TrzszBuffer {
  constructor() {
    this.bufArray = [];
    this.resolve = null;
    this.reject = null;
    this.bufHead = 0;
    this.bufTail = 0;
    this.nextIdx = 0;
    this.nextBuf = null;
    this.arrBuf = new ArrayBuffer(128);
  }
  /**
   * Add a buffer to the queue.
   * @param buf - The buffer to add.
   */
  addBuffer(buf) {
    this.bufArray[this.bufTail++] = buf;
    if (this.resolve != null) {
      this.resolve();
      this.resolve = null;
      this.reject = null;
    }
  }
  /**
   * Stop the buffer and reject any pending operations.
   */
  stopBuffer() {
    if (this.reject != null) {
      this.reject(new TrzszError("Stopped"));
      this.reject = null;
      this.resolve = null;
    }
  }
  /**
   * Drain all buffers.
   */
  drainBuffer() {
    this.bufArray = [];
    this.bufHead = 0;
    this.bufTail = 0;
  }
  /**
   * Convert a buffer to Uint8Array.
   * @param buf - The buffer to convert.
   * @return The resulting Uint8Array.
   */
  async toUint8Array(buf) {
    if (typeof buf === "string") {
      return strToUint8(buf);
    } else if (buf instanceof ArrayBuffer) {
      return new Uint8Array(buf);
    } else if (buf instanceof Uint8Array) {
      return buf;
    } else if (buf instanceof Blob) {
      const buffer = await buf.arrayBuffer();
      return new Uint8Array(buffer);
    } else {
      throw new TrzszError("The buffer type is not supported", null, true);
    }
  }
  /**
   * Get the next buffer.
   * @return The next buffer.
   */
  async nextBuffer() {
    if (this.nextBuf != null && this.nextIdx < this.nextBuf.length) {
      return this.nextBuf.subarray(this.nextIdx);
    }
    if (this.bufHead === this.bufTail) {
      if (this.bufHead !== 0) {
        this.bufHead = 0;
        this.bufTail = 0;
      }
      await new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    }
    const buf = this.bufArray[this.bufHead];
    this.bufArray[this.bufHead] = null;
    this.bufHead++;
    if (buf == null) {
      throw new TrzszError("Unexpected null buffer");
    }
    this.nextBuf = await this.toUint8Array(buf);
    this.nextIdx = 0;
    return this.nextBuf;
  }
  /**
   * Grow the buffer.
   * @param dst - The destination buffer.
   * @param idx - The current index.
   * @param min - The minimum size needed.
   * @return The grown buffer.
   */
  growBuffer(dst, idx, min) {
    const len = Math.max(dst.length * 2, idx + min);
    this.arrBuf = new ArrayBuffer(len);
    const buf = new Uint8Array(this.arrBuf);
    buf.set(dst.subarray(0, idx));
    return buf;
  }
  /**
   * Append a buffer to another.
   * @param dst - The destination buffer.
   * @param idx - The current index.
   * @param src - The source buffer.
   * @return The resulting buffer.
   */
  appendBuffer(dst, idx, src) {
    const buf = dst.length >= idx + src.length ? dst : this.growBuffer(dst, idx, src.length);
    buf.set(src, idx);
    return buf;
  }
  /**
   * Read a line from the buffer.
   * @return The line.
   */
  async readLine() {
    let buf = new Uint8Array(this.arrBuf);
    let len = 0;
    while (true) {
      let next = await this.nextBuffer();
      const newLineIdx = next.indexOf(10);
      if (newLineIdx >= 0) {
        this.nextIdx += newLineIdx + 1;
        next = next.subarray(0, newLineIdx);
      } else {
        this.nextIdx += next.length;
      }
      if (next.includes(3)) {
        throw new TrzszError("Interrupted");
      }
      buf = this.appendBuffer(buf, len, next);
      len += next.length;
      if (newLineIdx >= 0) {
        return await uint8ToStr(buf.subarray(0, len));
      }
    }
  }
  /**
   * Read binary data from the buffer.
   * @param len - The length to read.
   * @return The binary data.
   */
  async readBinary(len) {
    if (this.arrBuf.byteLength < len) {
      this.arrBuf = new ArrayBuffer(len);
    }
    const buf = new Uint8Array(this.arrBuf, 0, len);
    let idx = 0;
    while (idx < len) {
      const left = len - idx;
      let next = await this.nextBuffer();
      if (next.length > left) {
        this.nextIdx += left;
        next = next.subarray(0, left);
      } else {
        this.nextIdx += next.length;
      }
      buf.set(next, idx);
      idx += next.length;
    }
    return buf;
  }
  /**
   * Read a line on Windows (handles VT100 escape sequences).
   * @return The line.
   */
  async readLineOnWindows() {
    let buf = new Uint8Array(this.arrBuf);
    let lastByte = 27;
    let skipVT100 = false;
    let hasNewline = false;
    let mayDuplicate = false;
    let hasCursorHome = false;
    let preHasCursorHome = false;
    let idx = 0;
    while (true) {
      let next = await this.nextBuffer();
      const newLineIdx = next.indexOf(33);
      if (newLineIdx >= 0) {
        this.nextIdx += newLineIdx + 1;
        next = next.subarray(0, newLineIdx);
      } else {
        this.nextIdx += next.length;
      }
      for (let i = 0; i < next.length; i++) {
        const c = next[i];
        if (c === 3) {
          throw new TrzszError("Interrupted");
        }
        if (c === 10) {
          hasNewline = true;
        }
        if (skipVT100) {
          if (isVT100End(c)) {
            skipVT100 = false;
            if (c === 72 && lastByte >= 48 && lastByte <= 57) {
              mayDuplicate = true;
            }
          }
          if (lastByte === 91 && c === 72) {
            hasCursorHome = true;
          }
          lastByte = c;
        } else if (c === 27) {
          skipVT100 = true;
          lastByte = c;
        } else if (isTrzszLetter(c)) {
          if (mayDuplicate) {
            mayDuplicate = false;
            if (hasNewline && idx > 0 && (c === buf[idx - 1] || preHasCursorHome)) {
              buf[idx - 1] = c;
              continue;
            }
          }
          if (idx >= buf.length) {
            buf = this.growBuffer(buf, idx, next.length);
          }
          buf[idx++] = c;
          preHasCursorHome = hasCursorHome;
          hasCursorHome = false;
          hasNewline = false;
        }
      }
      if (newLineIdx >= 0 && idx > 0 && !skipVT100) {
        return await uint8ToStr(buf.subarray(0, idx));
      }
    }
  }
}
function getEscapeChars(escapeAll) {
  const escapeChars = [
    ["î", "îî"],
    ["~", "î1"]
  ];
  if (escapeAll) {
    const chars = "\r\x1B";
    for (let i = 0; i < chars.length; i++) {
      escapeChars.push([chars[i], "î" + String.fromCharCode(65 + i)]);
    }
  }
  return escapeChars;
}
function escapeCharsToCodes(escapeChars) {
  const escapeCodes = [];
  for (let i = 0; i < escapeChars.length; i++) {
    escapeCodes.push([
      escapeChars[i][0].charCodeAt(0),
      escapeChars[i][1].charCodeAt(0),
      escapeChars[i][1].charCodeAt(1)
    ]);
  }
  return escapeCodes;
}
function escapeData(data, escapeCodes) {
  if (escapeCodes.length === 0) {
    return data;
  }
  const buf = new Uint8Array(data.length * 2);
  let idx = 0;
  for (let i = 0; i < data.length; i++) {
    let escapeIdx = -1;
    for (let j = 0; j < escapeCodes.length; j++) {
      if (data[i] === escapeCodes[j][0]) {
        escapeIdx = j;
        break;
      }
    }
    if (escapeIdx < 0) {
      buf[idx++] = data[i];
    } else {
      buf[idx++] = escapeCodes[escapeIdx][1];
      buf[idx++] = escapeCodes[escapeIdx][2];
    }
  }
  return buf.subarray(0, idx);
}
function unescapeData(data, escapeCodes) {
  if (escapeCodes.length === 0) {
    return data;
  }
  const buf = new Uint8Array(data.length);
  let idx = 0;
  for (let i = 0; i < data.length; i++) {
    let escapeIdx = -1;
    if (i < data.length - 1) {
      for (let j = 0; j < escapeCodes.length; j++) {
        if (data[i] === escapeCodes[j][1] && data[i + 1] === escapeCodes[j][2]) {
          escapeIdx = j;
          break;
        }
      }
    }
    if (escapeIdx < 0) {
      buf[idx++] = data[i];
    } else {
      buf[idx++] = escapeCodes[escapeIdx][0];
      i++;
    }
  }
  return buf.subarray(0, idx);
}
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
    const md5 = new tsMd5.Md5();
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
    const md5 = new tsMd5.Md5();
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
function getLength(str) {
  return str.replace(/[\u4e00-\u9fa5]/g, "**").length;
}
function getEllipsisString(str, max) {
  max -= 3;
  let len = 0;
  let sub = "";
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) >= 19968 && str.charCodeAt(i) <= 40869) {
      if (len + 2 > max) {
        return { sub: sub + "...", len: len + 3 };
      }
      len += 2;
    } else {
      if (len + 1 > max) {
        return { sub: sub + "...", len: len + 3 };
      }
      len += 1;
    }
    sub += str[i];
  }
  return { sub: sub + "...", len: len + 3 };
}
function convertSizeToString(size) {
  let unit = "B";
  do {
    if (size < 1024) {
      break;
    }
    size = size / 1024;
    unit = "KB";
    if (size < 1024) {
      break;
    }
    size = size / 1024;
    unit = "MB";
    if (size < 1024) {
      break;
    }
    size = size / 1024;
    unit = "GB";
    if (size < 1024) {
      break;
    }
    size = size / 1024;
    unit = "TB";
  } while (false);
  if (size >= 100) {
    return `${size.toFixed(0)} ${unit}`;
  } else if (size >= 10) {
    return `${size.toFixed(1)} ${unit}`;
  } else {
    return `${size.toFixed(2)} ${unit}`;
  }
}
function convertTimeToString(seconds) {
  let result = "";
  if (seconds >= 3600) {
    result += Math.floor(seconds / 3600).toString() + ":";
    seconds %= 3600;
  }
  const minute = Math.floor(seconds / 60);
  result += minute >= 10 ? minute.toString() : "0" + minute.toString();
  result += ":";
  const second = Math.round(seconds % 60);
  result += second >= 10 ? second.toString() : "0" + second.toString();
  return result;
}
const kSpeedArraySize = 30;
class TextProgressBar {
  /**
   * Create a TextProgressBar.
   * @param writer - The output writer function.
   * @param columns - The terminal columns.
   * @param tmuxPaneColumns - The tmux pane columns (optional).
   */
  constructor(writer, columns, tmuxPaneColumns = void 0) {
    this.lastUpdateTime = 0;
    this.fileCount = 0;
    this.fileIdx = 0;
    this.fileName = "";
    this.fileSize = 0;
    this.fileStep = 0;
    this.startTime = 0;
    this.firstWrite = true;
    this.speedCnt = 0;
    this.speedIdx = 0;
    this.timeArray = new Array(kSpeedArraySize);
    this.stepArray = new Array(kSpeedArraySize);
    this.writer = writer;
    this.tmuxPaneColumns = tmuxPaneColumns ?? 0;
    this.columns = this.tmuxPaneColumns > 1 ? this.tmuxPaneColumns - 1 : columns;
  }
  /**
   * Set the terminal columns.
   * @param columns - The terminal columns.
   */
  setTerminalColumns(columns) {
    this.columns = columns;
    if (this.tmuxPaneColumns > 0) {
      this.tmuxPaneColumns = 0;
    }
  }
  /**
   * Called when the number of files is known.
   * @param num - The number of files.
   */
  onNum(num) {
    this.fileCount = num;
    this.fileIdx = 0;
  }
  /**
   * Called when a file name is known.
   * @param name - The file name.
   */
  onName(name) {
    this.fileName = name;
    this.fileIdx += 1;
    this.startTime = Date.now();
    this.timeArray[0] = this.startTime;
    this.stepArray[0] = 0;
    this.speedCnt = 1;
    this.speedIdx = 1;
    this.fileStep = -1;
  }
  /**
   * Called when the file size is known.
   * @param size - The file size.
   */
  onSize(size) {
    this.fileSize = size;
  }
  /**
   * Called when a step is completed.
   * @param step - The step number.
   */
  onStep(step) {
    if (step <= this.fileStep) {
      return;
    }
    this.fileStep = step;
    this.showProgress();
  }
  /**
   * Hide the cursor.
   */
  hideCursor() {
    this.writer("\x1B[?25l");
  }
  /**
   * Show the cursor.
   */
  showCursor() {
    this.writer("\x1B[?25h");
  }
  /**
   * Show the progress.
   */
  showProgress() {
    const now = Date.now();
    if (now - this.lastUpdateTime < 200) {
      return;
    }
    this.lastUpdateTime = now;
    let percentage = "100%";
    if (this.fileSize !== 0) {
      percentage = Math.round(this.fileStep * 100 / this.fileSize).toString() + "%";
    }
    const total = convertSizeToString(this.fileStep);
    const speed = this.getSpeed(now);
    let speedStr = "--- B/s";
    let etaStr = "--- ETA";
    if (speed > 0) {
      speedStr = convertSizeToString(speed) + "/s";
      etaStr = convertTimeToString(Math.round((this.fileSize - this.fileStep) / speed)) + " ETA";
    }
    const progressText = this.getProgressText(percentage, total, speedStr, etaStr);
    if (this.firstWrite) {
      this.firstWrite = false;
      this.writer(progressText);
      return;
    }
    if (this.tmuxPaneColumns > 0) {
      this.writer(`\x1B[${this.columns}D${progressText}`);
    } else {
      this.writer(`\r${progressText}`);
    }
  }
  /**
   * Get the current transfer speed.
   * @param now - The current time.
   * @return The speed in bytes per second.
   */
  getSpeed(now) {
    let speed;
    if (this.speedCnt <= kSpeedArraySize) {
      this.speedCnt++;
      speed = (this.fileStep - this.stepArray[0]) * 1e3 / (now - this.timeArray[0]);
    } else {
      speed = (this.fileStep - this.stepArray[this.speedIdx]) * 1e3 / (now - this.timeArray[this.speedIdx]);
    }
    this.timeArray[this.speedIdx] = now;
    this.stepArray[this.speedIdx] = this.fileStep;
    this.speedIdx++;
    if (this.speedIdx >= kSpeedArraySize) {
      this.speedIdx %= kSpeedArraySize;
    }
    return isFinite(speed) ? speed : -1;
  }
  /**
   * Get the progress text.
   * @param percentage - The percentage string.
   * @param total - The total string.
   * @param speed - The speed string.
   * @param eta - The ETA string.
   * @return The progress text.
   */
  getProgressText(percentage, total, speed, eta) {
    const barMinLength = 24;
    let left = this.fileCount > 1 ? `(${this.fileIdx}/${this.fileCount}) ${this.fileName}` : this.fileName;
    let leftLength = getLength(left);
    let right = ` ${percentage} | ${total} | ${speed} | ${eta}`;
    do {
      if (this.columns - leftLength - right.length >= barMinLength) {
        break;
      }
      if (leftLength > 50) {
        ({ sub: left, len: leftLength } = getEllipsisString(left, 50));
      }
      if (this.columns - leftLength - right.length >= barMinLength) {
        break;
      }
      if (leftLength > 40) {
        ({ sub: left, len: leftLength } = getEllipsisString(left, 40));
      }
      if (this.columns - leftLength - right.length >= barMinLength) {
        break;
      }
      right = ` ${percentage} | ${speed} | ${eta}`;
      if (this.columns - leftLength - right.length >= barMinLength) {
        break;
      }
      if (leftLength > 30) {
        ({ sub: left, len: leftLength } = getEllipsisString(left, 30));
      }
      if (this.columns - leftLength - right.length >= barMinLength) {
        break;
      }
      right = ` ${percentage} | ${eta}`;
      if (this.columns - leftLength - right.length >= barMinLength) {
        break;
      }
      right = ` ${percentage}`;
      if (this.columns - leftLength - right.length >= barMinLength) {
        break;
      }
      if (leftLength > 20) {
        ({ sub: left, len: leftLength } = getEllipsisString(left, 20));
      }
      if (this.columns - leftLength - right.length >= barMinLength) {
        break;
      }
      left = "";
      leftLength = 0;
    } while (false);
    let barLength = this.columns - right.length;
    if (leftLength > 0) {
      barLength -= leftLength + 1;
      left += " ";
    }
    const bar = this.getProgressBar(barLength);
    return (left + bar + right).trim();
  }
  /**
   * Get the progress bar string.
   * @param len - The length of the bar.
   * @return The progress bar string.
   */
  getProgressBar(len) {
    if (len < 12) {
      return "";
    }
    const total = len - 2;
    let complete = total;
    if (this.fileSize !== 0) {
      complete = Math.round(total * this.fileStep / this.fileSize);
    }
    return "[\x1B[36m" + "█".repeat(complete) + "░".repeat(total - complete) + "\x1B[0m]";
  }
  /**
   * Called when the transfer is done.
   */
  onDone() {
    if (this.fileSize === 0) {
      return;
    }
    this.fileStep = this.fileSize;
    this.lastUpdateTime = 0;
    this.showProgress();
  }
}
exports.TextProgressBar = TextProgressBar;
exports.TmuxMode = TmuxMode;
exports.TrzszBuffer = TrzszBuffer;
exports.TrzszError = TrzszError;
exports.TrzszTransfer = TrzszTransfer;
exports.checkDuplicateNames = checkDuplicateNames;
exports.decodeBuffer = decodeBuffer;
exports.encodeBuffer = encodeBuffer;
exports.escapeCharsToCodes = escapeCharsToCodes;
exports.escapeData = escapeData;
exports.formatSavedFiles = formatSavedFiles;
exports.getEllipsisString = getEllipsisString;
exports.getEscapeChars = getEscapeChars;
exports.isArrayOfType = isArrayOfType;
exports.isVT100End = isVT100End;
exports.strToArrBuf = strToArrBuf;
exports.strToUint8 = strToUint8;
exports.strToUtf8 = strToUtf8;
exports.stripServerOutput = stripServerOutput;
exports.stripTmuxStatusLine = stripTmuxStatusLine;
exports.trzszVersion = trzszVersion;
exports.uint8ToStr = uint8ToStr;
exports.unescapeData = unescapeData;
//# sourceMappingURL=index.cjs.map
