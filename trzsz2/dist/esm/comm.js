import Pako from "pako";
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
export {
  TmuxMode,
  TrzszError,
  checkDuplicateNames,
  decodeBuffer,
  encodeBuffer,
  formatSavedFiles,
  isArrayOfType,
  isVT100End,
  strToArrBuf,
  strToUint8,
  strToUtf8,
  stripServerOutput,
  stripTmuxStatusLine,
  trzszVersion,
  uint8ToStr
};
//# sourceMappingURL=comm.js.map
