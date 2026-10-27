export class GeneralError extends Error {
    code;
    constructor(message, code = 400) {
        super(message);
        this.code = code;
        this.name = 'GeneralError';
    }
}
export class SocketError extends Error {
    code;
    constructor(message, code = 500) {
        super(message);
        this.code = code;
        this.name = 'SocketError';
    }
}
export class FileSystemError extends Error {
    code;
    constructor(message, code = 400) {
        super(message);
        this.code = code;
        this.name = 'FileSystemError';
    }
}
export class ConnectorError extends Error {
    code;
    constructor(message, code = 400) {
        super(message);
        this.code = code;
        this.name = 'ConnectorError';
    }
}
