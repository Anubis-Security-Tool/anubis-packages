/**
 * trzsz2: https://github.com/zxdong262/trzsz2
 * Copyright(c) 2024 Lonny Wong
 * @license MIT
 *
 * Pure protocol implementation without fs/browser dependencies.
 */
/**
 * trzsz version
 */
export declare const trzszVersion = "2.0.0";
/**
 * Convert a string to Uint8Array.
 * @param {string} str - The input string.
 * @return {Uint8Array} The resulting Uint8Array.
 */
export declare function strToUint8(str: string): Uint8Array;
/**
 * Convert a string to Uint8Array using UTF-8 encoding.
 * @param {string} str - The input string.
 * @return {Uint8Array} The resulting UTF-8 encoded Uint8Array.
 */
export declare function strToUtf8(str: string): Uint8Array;
/**
 * Convert a Uint8Array to string.
 * @param {Uint8Array} buf - The input buffer.
 * @param {string} encoding - The encoding to use.
 * @return {Promise<string>} The resulting string.
 */
export declare function uint8ToStr(buf: Uint8Array, encoding?: string): Promise<string>;
/**
 * Convert a string to ArrayBuffer.
 * @param {string} str - The input string.
 * @return {ArrayBuffer} The resulting ArrayBuffer.
 */
export declare function strToArrBuf(str: string): ArrayBuffer;
/**
 * Encode a buffer (compress and base64).
 * @param {string | Uint8Array} buf - The input buffer.
 * @return {string} The encoded string.
 */
export declare function encodeBuffer(buf: string | Uint8Array): string;
/**
 * Decode a buffer (base64 and decompress).
 * @param {string} buf - The encoded string.
 * @return {Uint8Array} The decoded buffer.
 */
export declare function decodeBuffer(buf: string): Uint8Array;
/**
 * Custom error class for trzsz operations.
 */
export declare class TrzszError extends Error {
    private readonly type;
    private readonly trace;
    constructor(message: string, type?: string | null, trace?: boolean);
    /**
     * Check if the error should include traceback.
     * @return {boolean} True if traceback should be included.
     */
    isTraceBack(): boolean;
    /**
     * Check if the error is a remote exit.
     * @return {boolean} True if remote exit.
     */
    isRemoteExit(): boolean;
    /**
     * Check if the error is a remote failure.
     * @return {boolean} True if remote failure.
     */
    isRemoteFail(): boolean;
    /**
     * Check if the error indicates stop and delete.
     * @return {boolean} True if stop and delete.
     */
    isStopAndDelete(): boolean;
    /**
     * Get the error message.
     * @param {Error} err - The error object.
     * @return {string} The error message.
     */
    static getErrorMessage(err: Error): string;
}
/**
 * Interface for trzsz file operations.
 */
export interface TrzszFile {
    closeFile: () => void;
}
/**
 * Interface for trzsz file reader.
 */
export interface TrzszFileReader extends TrzszFile {
    getPathId: () => number;
    getRelPath: () => string[];
    isDir: () => boolean;
    getSize: () => number;
    readFile: (buf: ArrayBuffer) => Promise<Uint8Array>;
}
/**
 * Interface for trzsz file writer.
 */
export interface TrzszFileWriter extends TrzszFile {
    getFileName: () => string;
    getLocalName: () => string;
    isDir: () => boolean;
    writeFile: (buf: Uint8Array) => Promise<void>;
    deleteFile: () => Promise<string>;
}
/**
 * Type for opening save file.
 */
export type OpenSaveFile = (saveParam: any, fileName: string, directory: boolean, overwrite: boolean) => Promise<TrzszFileWriter>;
/**
 * Interface for progress callback.
 */
export interface ProgressCallback {
    onNum: (num: number) => void;
    onName: (name: string) => void;
    onSize: (size: number) => void;
    onStep: (step: number) => void;
    onDone: () => void;
}
/**
 * Check for duplicate file names.
 * @param {TrzszFileReader[]} files - The files to check.
 */
export declare function checkDuplicateNames(files: TrzszFileReader[]): void;
/**
 * Check if an array contains only elements of a specific type.
 * @param {any} arr - The array to check.
 * @param {string} type - The type to check for.
 * @return {boolean} True if all elements are of the specified type.
 */
export declare function isArrayOfType(arr: any, type: string): boolean;
/**
 * Check if a character is a VT100 end character.
 * @param {number} c - The character code.
 * @return {boolean} True if it's a VT100 end character.
 */
export declare function isVT100End(c: number): boolean;
/**
 * Strip VT100 escape sequences from server output.
 * @param {string | ArrayBuffer | Uint8Array | Blob} output - The server output.
 * @return {string | ArrayBuffer | Uint8Array | Blob} The stripped output.
 */
export declare function stripServerOutput(output: string | ArrayBuffer | Uint8Array | Blob): string | ArrayBuffer | Uint8Array | Blob;
/**
 * Tmux mode constants.
 */
export declare const TmuxMode: {
    readonly NoTmux: 0;
    readonly TmuxNormalMode: 1;
    readonly TmuxControlMode: 2;
};
export type TmuxModeType = (typeof TmuxMode)[keyof typeof TmuxMode];
/**
 * Format saved files message.
 * @param {string[]} fileNames - The file names.
 * @param {string} destPath - The destination path.
 * @return {string} The formatted message.
 */
export declare function formatSavedFiles(fileNames: string[], destPath: string): string;
/**
 * Strip tmux status line from buffer.
 * @param {string} buf - The input buffer.
 * @return {string} The stripped buffer.
 */
export declare function stripTmuxStatusLine(buf: string): string;
