"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
exports.default = {
    directive: 'STOU',
    handler: async function ({ log, command }) {
        if (!this.fs)
            return this.reply(550, 'File system not instantiated');
        if (!this.fs.write)
            return this.reply(402, 'Not supported');
        const uniqueName = (0, crypto_1.randomUUID)().replace(/-/g, '') + (command.arg ? '_' + command.arg : '');
        try {
            const { stream, clientPath } = this.fs.write(uniqueName);
            await this.connector.waitForConnection();
            this.commandSocket.pause();
            await this.reply(150);
            await new Promise((resolve, reject) => {
                this.connector.socket.pipe(stream);
                stream.once('finish', () => resolve());
                stream.once('error', reject);
            });
            await this.reply(226, `Transfer complete. Unique filename: ${uniqueName}`);
            this.connector.end();
            this.commandSocket.resume();
        }
        catch (err) {
            log.error(err);
            await this.reply(451, err.message || 'Error writing file');
            this.connector.end();
            this.commandSocket.resume();
        }
    },
    syntax: '{{cmd}} [<path>]',
    description: 'Store file uniquely',
};
