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
export {
  TextProgressBar,
  getEllipsisString
};
//# sourceMappingURL=progress.js.map
