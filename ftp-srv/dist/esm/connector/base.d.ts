import net from 'net';
import { EventEmitter } from 'events';
import type FtpConnection from '../connection.js';
export interface ConnectorOptions {
    socket?: net.Socket;
}
declare abstract class BaseConnector extends EventEmitter {
    protected connection: FtpConnection;
    protected dataSocket: net.Socket | null;
    protected server: net.Server | null;
    constructor(connection: FtpConnection);
    abstract getSocket(): Promise<net.Socket>;
    abstract setup(...args: any[]): Promise<any>;
    abstract waitForConnection(): Promise<net.Socket>;
    get socket(): net.Socket | null;
    end(): void;
    protected createDataSocket(): net.Socket;
}
export default BaseConnector;
