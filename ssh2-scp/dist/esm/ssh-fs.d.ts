import { Client } from 'ssh2';

export declare function createSshFs(session: Client, options?: SshFsOptions): SshFs;

export declare interface FileInfo {
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

export declare interface IconvDecoder {
    decode: (buf: Buffer, encoding: string) => string;
}

export declare function parseModeFromLongname(longname: string): number;

export declare class SshFs {
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

export declare interface SshFsOptions {
    iconv?: IconvDecoder;
    encoding?: string;
}

export declare interface Stats {
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

export { }
