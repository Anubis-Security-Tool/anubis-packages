export declare class GeneralError extends Error {
    code: number;
    constructor(message: string, code?: number);
}
export declare class SocketError extends Error {
    code: number;
    constructor(message: string, code?: number);
}
export declare class FileSystemError extends Error {
    code: number;
    constructor(message: string, code?: number);
}
export declare class ConnectorError extends Error {
    code: number;
    constructor(message: string, code?: number);
}
