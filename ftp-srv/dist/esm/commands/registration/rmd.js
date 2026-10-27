export default {
    directive: 'RMD',
    handler: async function ({ log, command }) {
        if (!this.fs)
            return this.reply(550, 'File system not instantiated');
        if (!this.fs.delete)
            return this.reply(402, 'Not supported');
        if (!command.arg)
            return this.reply(501, 'No path provided');
        try {
            await this.fs.delete(command.arg);
            return this.reply(250, 'Directory deleted');
        }
        catch (err) {
            log.error(err);
            return this.reply(550, err.message || 'Delete failed');
        }
    },
    syntax: '{{cmd}} <path>',
    description: 'Remove directory',
};
