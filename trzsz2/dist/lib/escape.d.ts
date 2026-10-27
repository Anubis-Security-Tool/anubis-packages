/**
 * trzsz2: https://github.com/zxdong262/trzsz2
 * Copyright(c) 2024 Lonny Wong
 * @license MIT
 *
 * Pure protocol implementation without fs/browser dependencies.
 */
/**
 * Get escape characters for trzsz protocol.
 * @param escapeAll - Whether to escape all special characters.
 * @return Array of escape character pairs.
 */
export declare function getEscapeChars(escapeAll: boolean): string[][];
/**
 * Convert escape characters to codes.
 * @param escapeChars - Array of escape character pairs.
 * @return Array of escape code triplets.
 */
export declare function escapeCharsToCodes(escapeChars: string[][]): number[][];
/**
 * Escape data using escape codes.
 * @param data - The data to escape.
 * @param escapeCodes - Array of escape code triplets.
 * @return The escaped data.
 */
export declare function escapeData(data: Uint8Array, escapeCodes: number[][]): Uint8Array;
/**
 * Unescape data using escape codes.
 * @param data - The data to unescape.
 * @param escapeCodes - Array of escape code triplets.
 * @return The unescaped data.
 */
export declare function unescapeData(data: Uint8Array, escapeCodes: number[][]): Uint8Array;
