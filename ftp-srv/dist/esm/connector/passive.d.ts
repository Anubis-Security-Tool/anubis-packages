import net from 'net';
import BaseConnector from './base.js';
import type FtpConnection from '../connection.js';
declare class PassiveConnector extends BaseConnector {
    private pasvIp;
    private minPort;
    private maxPort;
    private listeningPort;
    private connectionResolver;
    constructor(connection: FtpConnection, options: {
        pasvIp?: string | ((address: string) => string);
        minPort: number;
        maxPort: number;
    });
    setup(): Promise<{
        ip: string;
        port: number;
    }>;
    getSocket(): Promise<net.Socket>;
    waitForConnection(): Promise<net.Socket>;
}
export default PassiveConnector;
