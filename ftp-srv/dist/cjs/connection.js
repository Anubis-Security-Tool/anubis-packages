"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const crypto_1 = require("crypto");
const passive_1 = __importDefault(require("./connector/passive"));
const fs_1 = __importDefault(require("./fs"));
const commands_1 = __importDefault(require("./commands"));
const errors = __importStar(require("./errors"));
const messages_1 = __importDefault(require("./messages"));
class FtpConnection extends events_1.EventEmitter {
    server;
    id;
    commandSocket;
    log;
    commands;
    transferType;
    encoding;
    bufferSize;
    authenticated;
    fs;
    connector;
    _restByteCount;
    _secure;
    constructor(server, options) {
        super();
        this.server = server;
        this.id = (0, crypto_1.randomUUID)();
        this.commandSocket = options.socket;
        this.log = options.log.child({ id: this.id, ip: this.ip });
        this.commands = new commands_1.default(this);
        this.transferType = 'binary';
        this.encoding = 'utf8';
        this.bufferSize = false;
        this._restByteCount = 0;
        this._secure = false;
        this.authenticated = false;
        this.fs = null;
        this.connector = new passive_1.default(this, {
            pasvIp: this.server.options.pasv_url,
            minPort: this.server.options.pasv_min || 1024,
            maxPort: this.server.options.pasv_max || 65535,
        });
        this.commandSocket.on('error', (err) => {
            this.log.error(err, 'Client error');
            this.server.emit('client-error', { connection: this, context: 'commandSocket', error: err });
        });
        this.commandSocket.on('data', this._handleData.bind(this));
        this.commandSocket.on('timeout', () => {
            this.log.trace('Client timeout');
            this.close();
        });
        this.commandSocket.on('close', () => {
            if (this.connector)
                this.connector.end();
            if (this.commandSocket && !this.commandSocket.destroyed)
                this.commandSocket.destroy();
            this.removeAllListeners();
        });
    }
    async _handleData(data) {
        const messages = data.toString(this.encoding).split('\r\n').filter(Boolean);
        this.log.trace(messages);
        for (const message of messages) {
            await this.commands.handle(message);
        }
    }
    get ip() {
        try {
            return this.commandSocket ? this.commandSocket.remoteAddress || null : null;
        }
        catch {
            return null;
        }
    }
    get restByteCount() {
        return this._restByteCount > 0 ? this._restByteCount : undefined;
    }
    set restByteCount(rbc) {
        this._restByteCount = rbc || 0;
    }
    get secure() {
        return this.server.isTLS || this._secure;
    }
    set secure(sec) {
        this._secure = sec;
    }
    async login(username, password) {
        const loginListeners = this.server.listeners('login');
        if (!loginListeners || !loginListeners.length) {
            if (!this.server.options.anonymous) {
                throw new errors.GeneralError('No "login" listener setup', 500);
            }
        }
        else {
            const result = await new Promise((resolve, reject) => {
                this.server.emit('login', { connection: this, username, password }, resolve, reject);
            });
            this.authenticated = true;
            this.commands.blacklist = [...this.commands.blacklist, ...(result.blacklist || [])];
            this.commands.whitelist = [...this.commands.whitelist, ...(result.whitelist || [])];
            // Fall back to constructor-level root if the login handler didn't specify one
            const root = result.root || this.server.options.root;
            this.fs = result.fs || new fs_1.default(this, { root, cwd: result.cwd });
            return;
        }
        this.authenticated = true;
        this.fs = new fs_1.default(this, { root: this.server.options.root });
    }
    async close(code = 421, message = 'Closing connection') {
        if (code) {
            await this.reply(code, message);
        }
        this.commandSocket?.destroy();
    }
    async reply(options, ...letters) {
        const satisfyParameters = async () => {
            let opts = typeof options === 'number' ? { code: options } : { ...options };
            if (!Array.isArray(letters))
                letters = [letters];
            if (!letters.length)
                letters = [{}];
            const results = [];
            for (const promise of letters) {
                const letter = await Promise.resolve(promise);
                let resolvedLetter = typeof letter === 'string' ? { message: letter } : (letter || {});
                if (!resolvedLetter.socket) {
                    resolvedLetter.socket = opts.socket || this.commandSocket;
                }
                const useEmptyMessage = opts.useEmptyMessage;
                if (!useEmptyMessage) {
                    if (!resolvedLetter.message) {
                        resolvedLetter.message = messages_1.default[opts.code || 0] || 'No information';
                    }
                    if (!resolvedLetter.encoding) {
                        resolvedLetter.encoding = this.encoding;
                    }
                }
                const message = await Promise.resolve(resolvedLetter.message);
                if (!useEmptyMessage) {
                    const eol = opts.hasOwnProperty('eol') ? opts.eol : undefined;
                    const separator = eol === undefined ? (letters.length - 1 === results.length ? ' ' : '-') : eol ? ' ' : '-';
                    const code = resolvedLetter.code || opts.code;
                    resolvedLetter.message = resolvedLetter.raw ? message : [code, message].filter(Boolean).join(separator);
                }
                else {
                    resolvedLetter.message = '';
                }
                results.push(resolvedLetter);
            }
            return results;
        };
        const processLetter = async (letter) => {
            return new Promise((resolve, reject) => {
                if (letter.socket && letter.socket.writable) {
                    const addr = letter.socket.address();
                    this.log.trace({
                        port: addr && typeof addr === 'object' && 'port' in addr ? addr.port : 0,
                        encoding: letter.encoding,
                        message: letter.message
                    }, 'Reply');
                    letter.socket.write(letter.message + '\r\n', (letter.encoding || this.encoding), (error) => {
                        if (error) {
                            this.log.error({ error: error.message }, '[Process Letter] Socket Write Error');
                            return reject(error);
                        }
                        resolve();
                    });
                }
                else {
                    this.log.trace({ message: letter.message }, 'Could not write message');
                    reject(new Error('Socket not writable'));
                }
            });
        };
        try {
            const satisfiedLetters = await satisfyParameters();
            for (const letter of satisfiedLetters) {
                await processLetter(letter);
            }
        }
        catch (error) {
            this.log.error({ error: error.message }, 'Satisfy Parameters Error');
        }
    }
}
exports.default = FtpConnection;
