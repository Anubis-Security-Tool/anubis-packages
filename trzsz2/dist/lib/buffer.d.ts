/**
 * trzsz2: https://github.com/zxdong262/trzsz2
 * Copyright(c) 2024 Lonny Wong
 * @license MIT
 *
 * Pure protocol implementation without fs/browser dependencies.
 */
/**
 * TrzszBuffer class for handling buffer operations.
 */
export declare class TrzszBuffer {
    private bufArray;
    private resolve;
    private reject;
    private bufHead;
    private bufTail;
    private nextIdx;
    private nextBuf;
    private arrBuf;
    /**
     * Add a buffer to the queue.
     * @param buf - The buffer to add.
     */
    addBuffer(buf: string | ArrayBuffer | Uint8Array | Blob): void;
    /**
     * Stop the buffer and reject any pending operations.
     */
    stopBuffer(): void;
    /**
     * Drain all buffers.
     */
    drainBuffer(): void;
    /**
     * Convert a buffer to Uint8Array.
     * @param buf - The buffer to convert.
     * @return The resulting Uint8Array.
     */
    private toUint8Array;
    /**
     * Get the next buffer.
     * @return The next buffer.
     */
    private nextBuffer;
    /**
     * Grow the buffer.
     * @param dst - The destination buffer.
     * @param idx - The current index.
     * @param min - The minimum size needed.
     * @return The grown buffer.
     */
    private growBuffer;
    /**
     * Append a buffer to another.
     * @param dst - The destination buffer.
     * @param idx - The current index.
     * @param src - The source buffer.
     * @return The resulting buffer.
     */
    private appendBuffer;
    /**
     * Read a line from the buffer.
     * @return The line.
     */
    readLine(): Promise<string>;
    /**
     * Read binary data from the buffer.
     * @param len - The length to read.
     * @return The binary data.
     */
    readBinary(len: number): Promise<Uint8Array>;
    /**
     * Read a line on Windows (handles VT100 escape sequences).
     * @return The line.
     */
    readLineOnWindows(): Promise<string>;
}
