"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const events_1 = require("events");
class BaseConnector extends events_1.EventEmitter {
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
        this.dataSocket = new net_1.default.Socket();
        this.dataSocket.on('error', (err) => {
            this.emit('error', err);
        });
        return this.dataSocket;
    }
}
exports.default = BaseConnector;
