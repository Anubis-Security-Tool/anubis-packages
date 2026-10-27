import { sign as c } from "jsonwebtoken";
const d = ["headers", "data"], p = ["authorization", "cookie", "proxy-authorization", "x-auth-token", "x-api-key"], g = "[redacted]";
function f(r) {
  const e = {};
  for (const t of Object.keys(r))
    e[t] = p.includes(t.toLowerCase()) ? g : r[t];
  return e;
}
function h(r) {
  if (r == null || typeof r != "object")
    return r;
  const e = {};
  for (const t of Object.keys(r)) {
    const s = r[t], i = typeof s;
    if (i === "string" || i === "number" || i === "boolean")
      e[t] = s;
    else if (d.includes(t) && s !== null && i === "object")
      try {
        const o = JSON.parse(JSON.stringify(s));
        e[t] = t === "headers" ? f(o) : o;
      } catch {
      }
  }
  return e;
}
const n = 300;
function y(r) {
  if (r == null)
    return "";
  let e = "";
  if (typeof r == "string")
    e = r;
  else if (typeof r == "object") {
    const t = r.error;
    if (t != null && typeof t == "object" && typeof t.message == "string")
      e = t.message;
    else if (typeof r.message == "string")
      e = r.message;
    else if (Object.keys(r).length > 0)
      try {
        e = JSON.stringify(r);
      } catch {
        e = "";
      }
  } else
    e = String(r);
  return e = e.trim(), e.length > n && (e = e.slice(0, n) + `... (${e.length} chars)`), e;
}
class m extends Error {
  constructor(e, t, s, i) {
    const o = y(s);
    super(`status: ${e}
statusText: ${t}${o === "" ? "" : `
data: ${o}`}`), this.status = e, this.statusText = t, this.data = s, this.config = h(i);
  }
}
class w {
  constructor(e, t, s, i = "@ai-security-tool/sync/v2.0.0") {
    if (s === "github")
      this.token = e, this.server = "https://api.github.com", this.userId = "", this.algorithm = "HS256";
    else if (s === "gitee")
      this.token = e, this.server = "https://gitee.com/api/v5", this.userId = "", this.algorithm = "HS256";
    else {
      const [
        o,
        u,
        a = "",
        l = "HS256"
      ] = e.split("####");
      this.token = o, this.server = u, this.userId = a, this.algorithm = l;
    }
    this.type = s, this.userAgentHeader = i, this._axios = t;
  }
  async request(e) {
    try {
      return (await this._axios.request({
        ...e,
        headers: this._patchHeaders(e.headers)
      })).data;
    } catch (t) {
      throw t.response !== void 0 && t.response !== null ? new m(t.response.status, t.response.statusText, t.response.data, t.response.config) : (t.config !== void 0 && t.config !== null && (t.config = h(t.config)), t);
    }
  }
  async run(e, t) {
    return this.type === "github" ? await this._runGithub(e, t) : this.type === "gitee" ? await this._runGitee(e, t) : await this._runCustomOrCloud(e, t);
  }
  async _runGithub(e, t) {
    if (e === "test")
      return await this.request({
        url: `${this.server}/gists?per_page=1`,
        method: "GET"
      });
    if (e === "create") {
      const s = t[0];
      return await this.request({
        url: `${this.server}/gists`,
        method: "POST",
        data: s
      });
    } else if (e === "update") {
      const s = t[0], i = t[1];
      return await this.request({
        url: `${this.server}/gists/${s}`,
        method: "PATCH",
        data: i
      });
    } else if (e === "getOne") {
      const s = t[0];
      return await this.request({
        url: `${this.server}/gists/${s}`,
        method: "GET"
      });
    }
    throw new Error(`Unsupported func: ${e}`);
  }
  async _runGitee(e, t) {
    if (e === "test")
      return await this.request({
        url: `${this.server}/gists?per_page=1`,
        method: "GET"
      });
    if (e === "create") {
      const s = t[0];
      return await this.request({
        url: `${this.server}/gists`,
        method: "POST",
        data: s
      });
    } else if (e === "update") {
      const s = t[0], i = t[1];
      return await this.request({
        url: `${this.server}/gists/${s}`,
        method: "PATCH",
        data: i
      });
    } else if (e === "getOne") {
      const s = t[0];
      return await this.request({
        url: `${this.server}/gists/${s}`,
        method: "GET"
      });
    }
    throw new Error(`Unsupported func: ${e}`);
  }
  async _runCustomOrCloud(e, t) {
    if (e === "test")
      return t.length > 0 && (this.userId = t[0]), await this.request({
        url: this.server,
        method: "POST"
      });
    if (e === "create") {
      const s = t[0];
      return await this.request({
        url: this.server,
        method: "PUT",
        data: s
      });
    } else if (e === "update") {
      t.length > 1 && (this.userId = t[0]);
      const s = t.length > 1 ? t[1] : t[0];
      return await this.request({
        url: this.server,
        method: "PUT",
        data: s
      });
    } else if (e === "getOne")
      return t.length > 0 && (this.userId = t[0]), await this.request({
        url: this.server,
        method: "GET"
      });
    throw new Error(`Unsupported func: ${e}`);
  }
  _patchHeaders(e = {}) {
    return {
      "Content-Type": "application/json",
      ...this._authHeader(),
      "X-User-Agent": this.userAgentHeader,
      ...e
    };
  }
  _authHeader() {
    return this.type === "github" || this.type === "gitee" ? {
      Authorization: `token ${this.token}`
    } : {
      Authorization: `Bearer ${this.userId !== "" ? c({
        id: this.userId,
        exp: Date.now() + 1e6
      }, this.token, { algorithm: this.algorithm }) : this.token}`
    };
  }
}
async function E(r, e, t, s, i) {
  return await new w(i, r, e).run(t, s);
}
export {
  m as HTTPError,
  E as electermSync
};
