import net from 'net';
import tls from 'tls';
import { EventEmitter } from 'events';
import FtpConnection from './connection.js';
import type { FtpServerOptions, Logger } from './types.js';
declare class FtpServer extends EventEmitter {
    options: FtpServerOptions & {
        log: Logger;
    };
    connections: Record<string, FtpConnection>;
    log: Logger;
    url: URL;
    server: net.Server | tls.Server;
    getNextPasvPort: () => Promise<number>;
    private _greeting;
    private _features;
    constructor(options?: FtpServerOptions);
    get isTLS(): boolean;
    get port(): number;
    listen(): Promise<string>;
    emitPromise(action: string, ...data: any[]): Promise<any>;
    setupGreeting(greet?: string | string[] | null): string[];
    setupFeaturesMessage(): string;
    disconnectClient(id: string): Promise<void>;
    quit(): Promise<void>;
    close(): Promise<void>;
    private debounce;
}
export default FtpServer;
export { FtpServer };
export { FtpServer as FtpSrv };
export { default as FileSystem } from './fs.js';
export { default as FtpConnection } from './connection.js';
export * as errors from './errors.js';
