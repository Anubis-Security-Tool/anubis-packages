import { EventEmitter } from 'events';
import net from 'net';
import BaseConnector from './connector/base.js';
import FileSystem from './fs.js';
import Commands from './commands/index.js';
import type FtpServer from './index.js';
import type { Logger } from './types.js';
interface ConnectionOptions {
    log: Logger;
    socket: net.Socket;
}
interface ReplyLetter {
    socket?: net.Socket;
    message?: string;
    encoding?: string;
    raw?: boolean;
    code?: number;
    useEmptyMessage?: boolean;
    eol?: boolean;
}
declare class FtpConnection extends EventEmitter {
    server: FtpServer;
    id: string;
    commandSocket: net.Socket;
    log: Logger;
    commands: Commands;
    transferType: string;
    encoding: string;
    bufferSize: boolean;
    authenticated: boolean;
    fs: FileSystem | null;
    connector: BaseConnector;
    private _restByteCount;
    private _secure;
    constructor(server: FtpServer, options: ConnectionOptions);
    private _handleData;
    get ip(): string | null;
    get restByteCount(): number | undefined;
    set restByteCount(rbc: number | undefined);
    get secure(): boolean;
    set secure(sec: boolean);
    login(username: string, password: string): Promise<void>;
    close(code?: number, message?: string): Promise<void>;
    reply(options: number | ReplyLetter, ...letters: any[]): Promise<void>;
}
export default FtpConnection;
