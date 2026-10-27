"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    directive: 'FEAT',
    handler: async function ({ log, command }) {
        return this.reply(211, 'Features:', { raw: true, message: ' EPRT' }, { raw: true, message: ' EPSV' }, { raw: true, message: ' MDTM' }, { raw: true, message: ' PASV' }, { raw: true, message: ' REST STREAM' }, { raw: true, message: ' SIZE' }, { raw: true, message: ' TVFS' }, { raw: true, message: ' UTF8' }, 'End');
    },
    syntax: '{{cmd}}',
    description: 'Get the feature list implemented by the server',
    flags: {
        no_auth: true,
    },
};
