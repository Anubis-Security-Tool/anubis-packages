"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorError = exports.FileSystemError = exports.SocketError = exports.GeneralError = void 0;
class GeneralError extends Error {
    code;
    constructor(message, code = 400) {
        super(message);
        this.code = code;
        this.name = 'GeneralError';
    }
}
exports.GeneralError = GeneralError;
class SocketError extends Error {
    code;
    constructor(message, code = 500) {
        super(message);
        this.code = code;
        this.name = 'SocketError';
    }
}
exports.SocketError = SocketError;
class FileSystemError extends Error {
    code;
    constructor(message, code = 400) {
        super(message);
        this.code = code;
        this.name = 'FileSystemError';
    }
}
exports.FileSystemError = FileSystemError;
class ConnectorError extends Error {
    code;
    constructor(message, code = 400) {
        super(message);
        this.code = code;
        this.name = 'ConnectorError';
    }
}
exports.ConnectorError = ConnectorError;
