"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    directive: 'QUIT',
    handler: async function ({ log, command }) {
        return this.close(221, 'Goodbye');
    },
    syntax: '{{cmd}}',
    description: 'Close connection',
    flags: {
        no_auth: true,
    },
};
