import net from 'net';
import tls from 'tls';
import { EventEmitter } from 'events';
import { createLogger } from './helpers/logger.js';
import FtpConnection from './connection.js';
import { getNextPortFactory } from './helpers/find-port.js';
class FtpServer extends EventEmitter {
    options;
    connections;
    log;
    url;
    server;
    getNextPasvPort;
    _greeting;
    _features;
    constructor(options = {}) {
        super();
        this.options = Object.assign({
            log: createLogger({ name: 'ftp-srv' }),
            url: 'ftp://127.0.0.1:21',
            pasv_min: 1024,
            pasv_max: 65535,
            pasv_url: null,
            anonymous: false,
            file_format: 'ls',
            blacklist: [],
            whitelist: [],
            greeting: null,
            tls: false,
            timeout: 0,
            endOnProcessSignal: true,
        }, options);
        this._greeting = this.setupGreeting(this.options.greeting);
        this._features = this.setupFeaturesMessage();
        delete this.options.greeting;
        this.connections = {};
        this.log = this.options.log;
        this.url = new URL(this.options.url);
        this.getNextPasvPort = getNextPortFactory(this.url.hostname, this.options.pasv_min, this.options.pasv_max);
        const timeout = Number(this.options.timeout);
        this.options.timeout = isNaN(timeout) ? 0 : timeout;
        const serverConnectionHandler = (socket) => {
            if (this.options.timeout > 0) {
                socket.setTimeout(this.options.timeout);
            }
            const connection = new FtpConnection(this, { log: this.log, socket });
            this.connections[connection.id] = connection;
            socket.on('close', () => this.disconnectClient(connection.id));
            socket.once('close', () => {
                this.emit('disconnect', { connection, id: connection.id, newConnectionCount: Object.keys(this.connections).length });
            });
            this.emit('connect', { connection, id: connection.id, newConnectionCount: Object.keys(this.connections).length });
            const greeting = this._greeting || [];
            const features = this._features || 'Ready';
            return connection.reply(220, ...greeting, features)
                .then(() => socket.resume());
        };
        const serverOptions = Object.assign({}, this.isTLS ? this.options.tls : {}, { pauseOnConnect: true });
        this.server = this.isTLS
            ? tls.createServer(serverOptions, serverConnectionHandler)
            : net.createServer(serverOptions, serverConnectionHandler);
        this.server.on('error', (err) => {
            this.log.error(err, '[Event] error');
            this.emit('server-error', { error: err });
        });
        const quit = this.debounce(this.quit.bind(this), 100);
        if (this.options.endOnProcessSignal) {
            process.on('SIGTERM', quit);
            process.on('SIGINT', quit);
            process.on('SIGQUIT', quit);
        }
    }
    get isTLS() {
        return this.url.protocol === 'ftps:' && !!this.options.tls;
    }
    // WHATWG URL strips the port when it's the protocol default (ftp→21, ftps→990).
    // Recover it from the original option string so listen() always gets the right port.
    get port() {
        if (this.url.port)
            return Number(this.url.port);
        const defaults = { 'ftp:': 21, 'ftps:': 990 };
        const fromUrl = Number(new URL(this.options.url).port);
        if (fromUrl)
            return fromUrl;
        // Parse directly from the raw string to bypass WHATWG default-port stripping
        const match = this.options.url.match(/:(\d+)/);
        if (match)
            return Number(match[1]);
        return defaults[this.url.protocol] ?? 21;
    }
    listen() {
        const port = this.port;
        return new Promise((resolve, reject) => {
            this.server.once('error', reject);
            this.server.listen(port, this.url.hostname, (err) => {
                this.server.removeListener('error', reject);
                if (err)
                    return reject(err);
                this.log.info({
                    protocol: this.url.protocol.replace(/\W/g, ''),
                    ip: this.url.hostname,
                    port,
                }, 'Listening');
                resolve('Listening');
            });
        });
    }
    emitPromise(action, ...data) {
        return new Promise((resolve, reject) => {
            const params = [...data, resolve, reject];
            this.emit.call(this, action, ...params);
        });
    }
    setupGreeting(greet) {
        if (!greet)
            return [];
        return Array.isArray(greet) ? greet : greet.split('\n');
    }
    setupFeaturesMessage() {
        const features = [];
        if (this.options.anonymous)
            features.push('a');
        if (features.length) {
            features.unshift('Features:');
            features.push('.');
        }
        return features.length ? features.join(' ') : 'Ready';
    }
    async disconnectClient(id) {
        const client = this.connections[id];
        if (!client)
            return;
        delete this.connections[id];
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timed out disconnecting the client')), this.options.timeout || 1000);
        });
        try {
            await Promise.race([client.close(), timeoutPromise]);
        }
        catch (err) {
            this.log.error({ err, id }, 'Error closing connection');
        }
    }
    async quit() {
        await this.close();
        process.exit(0);
    }
    async close() {
        this.server.maxConnections = 0;
        this.emit('closing');
        this.log.info({ connections: Object.keys(this.connections).length }, 'Closing connections');
        await Promise.all(Object.keys(this.connections).map((id) => this.disconnectClient(id)));
        await new Promise((resolve) => {
            this.server.close(() => {
                this.log.info('Server closing...');
                resolve();
            });
        });
        this.log.debug('Removing event listeners...');
        this.emit('closed', {});
        this.removeAllListeners();
    }
    debounce(fn, delay) {
        let timer = null;
        return ((...args) => {
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        });
    }
}
export default FtpServer;
export { FtpServer };
// Backward-compat alias — the original ftp-srv package exported the class as FtpSrv
export { FtpServer as FtpSrv };
export { default as FileSystem } from './fs.js';
export { default as FtpConnection } from './connection.js';
export * as errors from './errors.js';
