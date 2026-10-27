import { OpenSaveFile, TrzszFileReader, ProgressCallback } from './comm';
/**
 * TrzszTransfer class for handling file transfer protocol.
 */
export declare class TrzszTransfer {
    private readonly buffer;
    private readonly writer;
    private readonly isWindowsShell;
    private remoteIsWindows;
    private lastInputTime;
    private readonly openedFiles;
    private readonly createdFiles;
    private tmuxOutputJunk;
    private cleanTimeoutInMilliseconds;
    private transferConfig;
    private stopped;
    private maxChunkTimeInMilliseconds;
    private protocolNewline;
    /**
     * Create a TrzszTransfer.
     * @param writer - The output writer function.
     * @param isWindowsShell - Whether the shell is Windows.
     */
    constructor(writer: (data: string | Uint8Array) => void, isWindowsShell?: boolean);
    /**
     * Cleanup resources.
     */
    cleanup(): void;
    /**
     * Add received data to the buffer.
     * @param data - The received data.
     */
    addReceivedData(data: string | ArrayBuffer | Uint8Array | Blob): void;
    /**
     * Stop transferring.
     */
    stopTransferring(): Promise<void>;
    /**
     * Clean input buffer.
     * @param timeoutInMilliseconds - The timeout in milliseconds.
     */
    private cleanInput;
    /**
     * Send a line.
     * @param typ - The type.
     * @param buf - The buffer.
     */
    private sendLine;
    /**
     * Receive a line.
     * @param expectType - The expected type.
     * @param mayHasJunk - Whether there may be junk.
     */
    private recvLine;
    /**
     * Receive and check a line.
     * @param expectType - The expected type.
     * @param mayHasJunk - Whether there may be junk.
     */
    private recvCheck;
    /**
     * Send an integer.
     * @param typ - The type.
     * @param val - The value.
     */
    private sendInteger;
    /**
     * Receive an integer.
     * @param typ - The type.
     * @param mayHasJunk - Whether there may be junk.
     */
    private recvInteger;
    /**
     * Check an integer.
     * @param expect - The expected value.
     */
    private checkInteger;
    /**
     * Send a string.
     * @param typ - The type.
     * @param str - The string.
     */
    private sendString;
    /**
     * Receive a string.
     * @param typ - The type.
     * @param mayHasJunk - Whether there may be junk.
     */
    private recvString;
    /**
     * Check a string.
     * @param expect - The expected string.
     */
    protected checkString(expect: string): Promise<void>;
    /**
     * Send binary data.
     * @param typ - The type.
     * @param buf - The buffer.
     */
    private sendBinary;
    /**
     * Receive binary data.
     * @param typ - The type.
     * @param mayHasJunk - Whether there may be junk.
     */
    private recvBinary;
    /**
     * Check binary data.
     * @param expect - The expected buffer.
     */
    private checkBinary;
    /**
     * Send data.
     * @param data - The data.
     * @param binary - Whether to use binary mode.
     * @param escapeCodes - The escape codes.
     */
    private sendData;
    /**
     * Receive data.
     * @param binary - Whether to use binary mode.
     * @param escapeCodes - The escape codes.
     * @param timeoutInMilliseconds - The timeout in milliseconds.
     */
    private recvData;
    /**
     * Send action.
     * @param confirm - Whether to confirm.
     * @param remoteIsWindows - Whether the remote is Windows.
     */
    sendAction(confirm: boolean, remoteIsWindows: boolean): Promise<void>;
    /**
     * Receive action.
     */
    recvAction(): Promise<Record<string, unknown>>;
    /**
     * Send config.
     * @param args - The config arguments.
     * @param escapeChars - The escape characters.
     * @param tmuxMode - The tmux mode.
     * @param tmuxPaneWidth - The tmux pane width.
     */
    sendConfig(args: Record<string, unknown>, escapeChars: string[][], tmuxMode: number, tmuxPaneWidth: number): Promise<void>;
    /**
     * Receive config.
     */
    recvConfig(): Promise<Record<string, unknown>>;
    /**
     * Send client exit.
     * @param msg - The message.
     */
    clientExit(msg: string): Promise<void>;
    /**
     * Receive exit.
     */
    recvExit(): Promise<string>;
    /**
     * Delete created files.
     */
    private deleteCreatedFiles;
    /**
     * Handle client error.
     * @param err - The error.
     */
    clientError(err: Error): Promise<void>;
    /**
     * Handle server error.
     * @param err - The error.
     */
    serverError(err: Error): Promise<void>;
    /**
     * Server exit - to be implemented by subclass or user.
     * @param msg - The message.
     */
    serverExit(_msg: string): Promise<void>;
    /**
     * Send file number.
     * @param num - The number of files.
     * @param progressCallback - The progress callback.
     */
    private sendFileNum;
    /**
     * Send file name.
     * @param file - The file reader.
     * @param directory - Whether it's a directory.
     * @param progressCallback - The progress callback.
     */
    private sendFileName;
    /**
     * Send file size.
     * @param size - The file size.
     * @param progressCallback - The progress callback.
     */
    private sendFileSize;
    /**
     * Send file data.
     * @param file - The file reader.
     * @param size - The file size.
     * @param binary - Whether to use binary mode.
     * @param escapeCodes - The escape codes.
     * @param maxBufSize - The maximum buffer size.
     * @param progressCallback - The progress callback.
     */
    private sendFileData;
    /**
     * Send file MD5.
     * @param digest - The MD5 digest.
     * @param progressCallback - The progress callback.
     */
    private sendFileMD5;
    /**
     * Send files.
     * @param files - The file readers.
     * @param progressCallback - The progress callback.
     */
    sendFiles(files: TrzszFileReader[], progressCallback: ProgressCallback | null): Promise<string[]>;
    /**
     * Receive file number.
     * @param progressCallback - The progress callback.
     */
    private recvFileNum;
    /**
     * Receive file name.
     * @param saveParam - The save parameter.
     * @param openSaveFile - The open save file function.
     * @param directory - Whether it's a directory.
     * @param overwrite - Whether to overwrite.
     * @param progressCallback - The progress callback.
     */
    private recvFileName;
    /**
     * Receive file size.
     * @param progressCallback - The progress callback.
     */
    private recvFileSize;
    /**
     * Receive file data.
     * @param file - The file writer.
     * @param size - The file size.
     * @param binary - Whether to use binary mode.
     * @param escapeCodes - The escape codes.
     * @param timeoutInMilliseconds - The timeout in milliseconds.
     * @param progressCallback - The progress callback.
     */
    private recvFileData;
    /**
     * Receive file MD5.
     * @param digest - The MD5 digest.
     * @param progressCallback - The progress callback.
     */
    private recvFileMD5;
    /**
     * Receive files.
     * @param saveParam - The save parameter.
     * @param openSaveFile - The open save file function.
     * @param progressCallback - The progress callback.
     */
    recvFiles(saveParam: unknown, openSaveFile: OpenSaveFile, progressCallback: ProgressCallback | null): Promise<string[]>;
}
