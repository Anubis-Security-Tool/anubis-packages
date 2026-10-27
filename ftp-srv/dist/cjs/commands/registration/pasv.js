"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passive_1 = __importDefault(require("../../connector/passive"));
const resolve_pasv_ip_1 = require("../../helpers/resolve-pasv-ip");
exports.default = {
    directive: 'PASV',
    handler: async function ({ log, command }) {
        this.connector = new passive_1.default(this, {
            pasvIp: (0, resolve_pasv_ip_1.resolvePasvIp)(this),
            minPort: this.server.options.pasv_min || 1024,
            maxPort: this.server.options.pasv_max || 65535,
        });
        try {
            const { ip, port } = await this.connector.setup();
            const host = ip.replace(/\./g, ',');
            const portByte1 = Math.floor(port / 256);
            const portByte2 = port % 256;
            return this.reply(227, `Entering Passive Mode (${host},${portByte1},${portByte2})`);
        }
        catch (err) {
            log.error(err);
            return this.reply(err.code || 425, err.message);
        }
    },
    syntax: '{{cmd}}',
    description: 'Initiate passive mode',
    flags: {
        no_auth: true,
    },
};
