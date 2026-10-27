import net from 'net';
import BaseConnector from './base.js';
import type FtpConnection from '../connection.js';
declare class ActiveConnector extends BaseConnector {
    private remoteAddress;
    private remotePort;
    constructor(connection: FtpConnection);
    setup(address: string, port: number): Promise<void>;
    getSocket(): Promise<net.Socket>;
    waitForConnection(): Promise<net.Socket>;
}
export default ActiveConnector;
