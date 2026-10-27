import { ProgressCallback } from './comm';
/**
 * Get ellipsis string if the string is too long.
 * @param str - The input string.
 * @param max - The maximum length.
 * @return The ellipsis string and its length.
 */
export declare function getEllipsisString(str: string, max: number): {
    sub: string;
    len: number;
};
/**
 * TextProgressBar class for displaying file transfer progress.
 */
export declare class TextProgressBar implements ProgressCallback {
    private readonly writer;
    private lastUpdateTime;
    private columns;
    private fileCount;
    private fileIdx;
    private fileName;
    private fileSize;
    private fileStep;
    private startTime;
    private tmuxPaneColumns;
    private firstWrite;
    private speedCnt;
    private speedIdx;
    private timeArray;
    private stepArray;
    /**
     * Create a TextProgressBar.
     * @param writer - The output writer function.
     * @param columns - The terminal columns.
     * @param tmuxPaneColumns - The tmux pane columns (optional).
     */
    constructor(writer: (output: string) => void, columns: number, tmuxPaneColumns?: number | undefined);
    /**
     * Set the terminal columns.
     * @param columns - The terminal columns.
     */
    setTerminalColumns(columns: number): void;
    /**
     * Called when the number of files is known.
     * @param num - The number of files.
     */
    onNum(num: number): void;
    /**
     * Called when a file name is known.
     * @param name - The file name.
     */
    onName(name: string): void;
    /**
     * Called when the file size is known.
     * @param size - The file size.
     */
    onSize(size: number): void;
    /**
     * Called when a step is completed.
     * @param step - The step number.
     */
    onStep(step: number): void;
    /**
     * Hide the cursor.
     */
    hideCursor(): void;
    /**
     * Show the cursor.
     */
    showCursor(): void;
    /**
     * Show the progress.
     */
    private showProgress;
    /**
     * Get the current transfer speed.
     * @param now - The current time.
     * @return The speed in bytes per second.
     */
    private getSpeed;
    /**
     * Get the progress text.
     * @param percentage - The percentage string.
     * @param total - The total string.
     * @param speed - The speed string.
     * @param eta - The ETA string.
     * @return The progress text.
     */
    private getProgressText;
    /**
     * Get the progress bar string.
     * @param len - The length of the bar.
     * @return The progress bar string.
     */
    private getProgressBar;
    /**
     * Called when the transfer is done.
     */
    onDone(): void;
}
