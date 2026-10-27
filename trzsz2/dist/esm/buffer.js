import { TrzszError, strToUint8, uint8ToStr, isVT100End } from "./comm.js";
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
export {
  TrzszBuffer
};
//# sourceMappingURL=buffer.js.map
