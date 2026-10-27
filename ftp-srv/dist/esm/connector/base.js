import net from 'net';
import { EventEmitter } from 'events';
class BaseConnector extends EventEmitter {
    connection;
    dataSocket = null;
    server = null;
    constructor(connection) {
        super();
        this.connection = connection;
    }
    get socket() {
        return this.dataSocket;
    }
    end() {
        if (this.dataSocket) {
            this.dataSocket.destroy();
            this.dataSocket = null;
        }
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }
    createDataSocket() {
        this.dataSocket = new net.Socket();
        this.dataSocket.on('error', (err) => {
            this.emit('error', err);
        });
        return this.dataSocket;
    }
}
export default BaseConnector;
