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
export {
  escapeCharsToCodes,
  escapeData,
  getEscapeChars,
  unescapeData
};
//# sourceMappingURL=escape.js.map
