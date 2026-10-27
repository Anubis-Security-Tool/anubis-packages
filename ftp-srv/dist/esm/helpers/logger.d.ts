interface LogLevel {
    (obj: Record<string, unknown>, msg?: string): void;
}
export interface Logger {
    child(bindings: Record<string, unknown>): Logger;
    trace: LogLevel;
    debug: LogLevel;
    info: LogLevel;
    warn: LogLevel;
    error: LogLevel;
    fatal: LogLevel;
}
export declare function createLogger(options?: {
    name?: string;
}): Logger;
export {};
