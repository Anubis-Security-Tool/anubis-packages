"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __importDefault(require("./base"));
const errors_1 = require("../errors");
class ActiveConnector extends base_1.default {
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
            throw new errors_1.ConnectorError('Remote address and port not set');
        }
        const socket = this.createDataSocket();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                socket.destroy();
                reject(new errors_1.ConnectorError('Connection timed out'));
            }, 30000);
            socket.once('connect', () => {
                clearTimeout(timeout);
                resolve(socket);
            });
            socket.once('error', (err) => {
                clearTimeout(timeout);
                reject(new errors_1.ConnectorError(`Failed to connect: ${err.message}`));
            });
            socket.connect(this.remotePort, this.remoteAddress);
        });
    }
    async waitForConnection() {
        return this.getSocket();
    }
}
exports.default = ActiveConnector;
