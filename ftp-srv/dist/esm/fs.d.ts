import { createReadStream, createWriteStream, type Stats } from 'fs';
import type FtpConnection from './connection.js';
export interface WriteOptions {
    append?: boolean;
    start?: number;
}
export interface ReadOptions {
    start?: number;
}
export interface WriteResult {
    stream: ReturnType<typeof createWriteStream>;
    clientPath: string;
}
export interface ReadResult {
    stream: ReturnType<typeof createReadStream>;
    clientPath: string;
}
declare class FileSystem {
    protected connection: FtpConnection;
    protected cwd: string;
    protected _root: string;
    constructor(connection: FtpConnection, { root, cwd }?: {
        root?: string;
        cwd?: string;
    });
    get root(): string;
    protected _resolvePath(file?: string): {
        clientPath: string;
        fsPath: string;
    };
    currentDirectory(): string;
    get(fileName: string): Promise<Stats & {
        name: string;
    }>;
    list(dirPath?: string): Promise<Array<Stats & {
        name: string;
    }>>;
    chdir(dirPath?: string): Promise<string>;
    write(fileName: string, { append, start }?: WriteOptions): WriteResult;
    read(fileName: string, { start }?: ReadOptions): Promise<ReadResult>;
    delete(targetPath: string): Promise<void>;
    mkdir(dirPath: string): Promise<string>;
    rename(from: string, to: string): Promise<void>;
    chmod(targetPath: string, mode: string | number): Promise<void>;
    getUniqueName(): string;
}
export default FileSystem;
