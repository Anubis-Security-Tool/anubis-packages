"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    directive: 'NLST',
    handler: async function ({ log, command }) {
        if (!this.fs)
            return this.reply(550, 'File system not instantiated');
        if (!this.fs.list)
            return this.reply(402, 'Not supported');
        const dirPath = command.arg || '.';
        try {
            await this.connector.waitForConnection();
            this.commandSocket.pause();
            const files = await this.fs.list(dirPath);
            await this.reply(150);
            for (const file of files) {
                this.connector.socket.write(file.name + '\r\n');
            }
            await this.reply(226, 'Transfer complete');
            this.connector.end();
            this.commandSocket.resume();
        }
        catch (err) {
            log.error(err);
            await this.reply(451, err.message || 'Error listing directory');
            this.connector.end();
            this.commandSocket.resume();
        }
    },
    syntax: '{{cmd}} [<path>]',
    description: 'Name list of directory',
};
