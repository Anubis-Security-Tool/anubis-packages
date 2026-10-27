"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    directive: 'ABOR',
    handler: function ({ log, command }) {
        return this.reply(225, 'ABOR command successful');
    },
    syntax: '{{cmd}}',
    description: 'Abort current transfer',
};
