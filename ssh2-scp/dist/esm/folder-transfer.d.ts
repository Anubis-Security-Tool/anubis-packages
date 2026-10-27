import { Client } from 'ssh2';

export declare class FolderTransfer {
    private session;
    private tarAdapter;
    private runRemoteCommand;
    private options;
    private chunkSize;
    private state;
    private aborted;
    private platformPromise;
    private pauseTarget;
    private activeChannel;
    private iconv?;
    private encoding;
    constructor(session: Client, tarAdapter: FolderTransferTarAdapter, options: TransferOptions);
    startTransfer(): Promise<void>;
    pause(): void;
    resume(): void;
    getState(): TransferState;
    destroy(): void;
    private createAbortError;
    private needsEncodingConversion;
    private createTarEncodingTransform;
    private download;
    private upload;
    private getRemotePlatform;
    private getRemoteFolderSize;
    private normalizeRemotePath;
    private getLocalFolderSize;
    private createProgressStream;
    private buildDownloadCommand;
    private buildUploadCommand;
    private escapePosix;
    private escapePowerShell;
    private toPowerShellCommand;
    private getChannelWritable;
    private execStream;
    private runExec;
    private waitForChannelClose;
}

export declare interface FolderTransferTarAdapter {
    c(options: {
        cwd: string;
        portable?: boolean;
    }, filePaths: string[]): NodeJS.ReadableStream;
    x(options: {
        cwd: string;
        strict?: boolean;
    }): NodeJS.WritableStream;
}

declare interface IconvDecoder {
    decode: (buf: Buffer, encoding: string) => string;
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
