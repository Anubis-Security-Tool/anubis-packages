"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    directive: 'NOOP',
    handler: async function ({ log, command }) {
        return this.reply(200, 'NOOP command successful');
    },
    syntax: '{{cmd}}',
    description: 'No operation',
    flags: {
        no_auth: true,
    },
};
