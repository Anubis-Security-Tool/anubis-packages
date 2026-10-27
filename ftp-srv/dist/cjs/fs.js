"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const fs_async_1 = __importDefault(require("./helpers/fs-async"));
const errors_1 = require("./errors");
const UNIX_SEP_REGEX = /\//g;
const WIN_SEP_REGEX = /\\/g;
class FileSystem {
    connection;
    cwd;
    _root;
    constructor(connection, { root, cwd } = {}) {
        this.connection = connection;
        this.cwd = path_1.default.normalize((cwd || '/').replace(WIN_SEP_REGEX, '/'));
        this._root = path_1.default.resolve(root || process.cwd());
    }
    get root() {
        return this._root;
    }
    _resolvePath(file = '.') {
        const resolvedPath = file.replace(WIN_SEP_REGEX, '/');
        const joinedPath = path_1.default.isAbsolute(resolvedPath)
            ? path_1.default.normalize(resolvedPath)
            : path_1.default.posix.join('/', this.cwd, resolvedPath);
        const fsPath = path_1.default.resolve(path_1.default.join(this.root, joinedPath)
            .replace(UNIX_SEP_REGEX, path_1.default.sep)
            .replace(WIN_SEP_REGEX, path_1.default.sep));
        const clientPath = joinedPath.replace(WIN_SEP_REGEX, '/');
        return { clientPath, fsPath };
    }
    currentDirectory() {
        return this.cwd;
    }
    async get(fileName) {
        const { fsPath } = this._resolvePath(fileName);
        const stat = await fs_async_1.default.stat(fsPath);
        return Object.assign(stat, { name: fileName });
    }
    async list(dirPath = '.') {
        const { fsPath } = this._resolvePath(dirPath);
        const fileNames = await fs_async_1.default.readdir(fsPath);
        const stats = await Promise.all(fileNames.map(async (fileName) => {
            const filePath = path_1.default.join(fsPath, fileName);
            try {
                await fs_async_1.default.access(filePath, fs_1.constants.F_OK);
                const stat = await fs_async_1.default.stat(filePath);
                return Object.assign(stat, { name: fileName });
            }
            catch {
                return null;
            }
        }));
        return stats.filter((stat) => stat !== null);
    }
    async chdir(dirPath = '.') {
        const { fsPath, clientPath } = this._resolvePath(dirPath);
        const stat = await fs_async_1.default.stat(fsPath);
        if (!stat.isDirectory()) {
            throw new errors_1.FileSystemError('Not a valid directory');
        }
        this.cwd = clientPath;
        return this.currentDirectory();
    }
    write(fileName, { append = false, start } = {}) {
        const { fsPath, clientPath } = this._resolvePath(fileName);
        const stream = (0, fs_1.createWriteStream)(fsPath, { flags: !append ? 'w+' : 'a+', start });
        stream.once('error', () => {
            fs_async_1.default.unlink(fsPath).catch(() => { });
        });
        stream.once('close', () => stream.end());
        return { stream, clientPath };
    }
    async read(fileName, { start } = {}) {
        const { fsPath, clientPath } = this._resolvePath(fileName);
        const stat = await fs_async_1.default.stat(fsPath);
        if (stat.isDirectory()) {
            throw new errors_1.FileSystemError('Cannot read a directory');
        }
        const stream = (0, fs_1.createReadStream)(fsPath, { flags: 'r', start });
        return { stream, clientPath };
    }
    async delete(targetPath) {
        const { fsPath } = this._resolvePath(targetPath);
        const stat = await fs_async_1.default.stat(fsPath);
        if (stat.isDirectory()) {
            await fs_async_1.default.rmdir(fsPath);
        }
        else {
            await fs_async_1.default.unlink(fsPath);
        }
    }
    async mkdir(dirPath) {
        const { fsPath } = this._resolvePath(dirPath);
        await fs_async_1.default.mkdir(fsPath, { recursive: true });
        return fsPath;
    }
    async rename(from, to) {
        const { fsPath: fromPath } = this._resolvePath(from);
        const { fsPath: toPath } = this._resolvePath(to);
        await fs_async_1.default.rename(fromPath, toPath);
    }
    async chmod(targetPath, mode) {
        const { fsPath } = this._resolvePath(targetPath);
        const modeNum = typeof mode === 'string' ? parseInt(mode, 8) : mode;
        await fs_async_1.default.chmod(fsPath, modeNum);
    }
    getUniqueName() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
}
exports.default = FileSystem;
