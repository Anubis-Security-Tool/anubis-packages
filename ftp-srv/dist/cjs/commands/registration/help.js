"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    directive: 'HELP',
    handler: async function ({ log, command }) {
        return this.reply(214, 'Help command available');
    },
    syntax: '{{cmd}} [<command>]',
    description: 'Get help',
    flags: {
        no_auth: true,
    },
};
