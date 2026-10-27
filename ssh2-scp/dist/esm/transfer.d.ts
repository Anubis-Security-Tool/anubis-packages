import { Client } from 'ssh2';

declare interface FileInfo {
    type: string;
    name: string;
    size: number;
    modifyTime: number;
    accessTime: number;
    mode: number;
    rights: {
        user: string;
        group: string;
        other: string;
    };
    owner: number;
    group: number;
}

declare interface IconvDecoder {
    decode: (buf: Buffer, encoding: string) => string;
}

declare interface IconvDecoder_2 {
    decode: (buf: Buffer, encoding: string) => string;
}

declare class SshFs {
    private session;
    private _chunkSize;
    private iconv?;
    private encoding;
    getChunkSize(): Promise<number>;
    constructor(session: Client, options?: SshFsOptions);
    private decodeBuffer;
    private detectChunkSize;
    private getExecOpts;
    private maskMode;
    private getMonthIndex;
    private runCmd;
    private rmFolderCmd;
    private rmCmd;
    getHomeDir(): Promise<string>;
    rmdir(remotePath: string): Promise<unknown>;
    private removeDirectoryRecursively;
    rmrf(remotePath: string): Promise<string>;
    touch(remotePath: string): Promise<string>;
    cp(from: string, to: string): Promise<unknown>;
    mv(from: string, to: string): Promise<unknown>;
    runExec(cmd: string): Promise<string>;
    getFolderSize(folderPath: string): Promise<{
        size: string;
        count: number;
    }>;
    private listFiles;
    list(remotePath: string): Promise<FileInfo[]>;
    mkdir(remotePath: string, options?: {
        mode?: number;
    }): Promise<string>;
    stat(remotePath: string): Promise<Stats>;
    readlink(remotePath: string): Promise<string>;
    realpath(remotePath: string): Promise<string>;
    lstat(remotePath: string): Promise<Stats>;
    chmod(remotePath: string, mode: number): Promise<string>;
    rename(remotePath: string, remotePathNew: string): Promise<string>;
    rmFolder(remotePath: string): Promise<string>;
    rm(remotePath: string): Promise<string>;
    readFile(remotePath: string, options?: {
        chunkSize?: number;
    }): Promise<string>;
    writeFile(remotePath: string, str: string, mode?: number, _options?: {
        chunkSize?: number;
    }): Promise<void>;
}

declare interface SshFsOptions {
    iconv?: IconvDecoder_2;
    encoding?: string;
}

declare interface Stats {
    isDirectory: () => boolean;
    isFile: () => boolean;
    isBlockDevice: () => boolean;
    isCharacterDevice: () => boolean;
    isSymbolicLink: () => boolean;
    isFIFO: () => boolean;
    isSocket: () => boolean;
    size: number;
    mode: number;
    uid: number;
    gid: number;
    atime: number;
    mtime: number;
}

export declare class Transfer {
    private session;
    private options;
    private chunkSize;
    private state;
    private aborted;
    private sshFs;
    private pauseTarget;
    private activeChannel;
    constructor(sshFs: SshFs, options: TransferOptions);
    startTransfer(): Promise<void>;
    private getRemoteFileSize;
    private runExec;
    private download;
    private upload;
    pause(): void;
    resume(): void;
    getState(): TransferState;
    destroy(): void;
    private createAbortError;
    private channelToReadable;
    private createProgressStream;
    private getChannelWritable;
    private execStream;
    private waitForChannelClose;
}

export declare interface TransferOptions {
    type: TransferType;
    remotePath: string;
    localPath: string;
    chunkSize?: number;
    iconv?: IconvDecoder & {
        encode: (str: string, encoding: string) => Buffer;
    };
    encoding?: string;
    onProgress?: (transferred: number, total: number) => void;
    onData?: (count: number) => void;
}

export declare interface TransferState {
    transferred: number;
    total: number;
    paused: boolean;
    completed: boolean;
    error?: Error;
}

export declare type TransferType = 'download' | 'upload';

export { }
