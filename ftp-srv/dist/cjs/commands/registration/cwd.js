"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escape_path_1 = require("../../helpers/escape-path");
exports.default = {
    directive: ['CWD', 'XCWD'],
    handler: async function ({ log, command }) {
        if (!this.fs)
            return this.reply(550, 'File system not instantiated');
        if (!this.fs.chdir)
            return this.reply(402, 'Not supported');
        if (!command.arg)
            return this.reply(501, 'No path provided');
        try {
            const cwd = await this.fs.chdir(command.arg);
            const dirPath = cwd ? `"${(0, escape_path_1.escapePath)(cwd)}"` : undefined;
            return this.reply(250, dirPath);
        }
        catch (err) {
            log.error(err);
            return this.reply(550, err.message || 'Directory change failed');
        }
    },
    syntax: '{{cmd}} <path>',
    description: 'Change working directory',
};
