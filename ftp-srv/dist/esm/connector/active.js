import BaseConnector from './base.js';
import { ConnectorError } from '../errors.js';
class ActiveConnector extends BaseConnector {
    remoteAddress;
    remotePort;
    constructor(connection) {
        super(connection);
        this.remoteAddress = '';
        this.remotePort = 0;
    }
    async setup(address, port) {
        this.remoteAddress = address;
        this.remotePort = port;
    }
    async getSocket() {
        if (!this.remoteAddress || !this.remotePort) {
            throw new ConnectorError('Remote address and port not set');
        }
        const socket = this.createDataSocket();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                socket.destroy();
                reject(new ConnectorError('Connection timed out'));
            }, 30000);
            socket.once('connect', () => {
                clearTimeout(timeout);
                resolve(socket);
            });
            socket.once('error', (err) => {
                clearTimeout(timeout);
                reject(new ConnectorError(`Failed to connect: ${err.message}`));
            });
            socket.connect(this.remotePort, this.remoteAddress);
        });
    }
    async waitForConnection() {
        return this.getSocket();
    }
}
export default ActiveConnector;
