"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    directive: 'ALLO',
    handler: function ({ log, command }) {
        return this.reply(202, 'ALLO command not needed');
    },
    syntax: '{{cmd}}',
    description: 'Allocate storage space',
};
