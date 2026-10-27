import PassiveConnector from '../../connector/passive.js';
import { resolvePasvIp } from '../../helpers/resolve-pasv-ip.js';
export default {
    directive: 'EPSV',
    handler: async function ({ log, command }) {
        this.connector = new PassiveConnector(this, {
            pasvIp: resolvePasvIp(this),
            minPort: this.server.options.pasv_min || 1024,
            maxPort: this.server.options.pasv_max || 65535,
        });
        try {
            const { ip, port } = await this.connector.setup();
            return this.reply(229, `Entering Extended Passive Mode (|||${port}|)`);
        }
        catch (err) {
            log.error(err);
            return this.reply(425, err.message || 'EPSV failed');
        }
    },
    syntax: '{{cmd}}',
    description: 'Extended passive mode',
    flags: {
        no_auth: true,
    },
};
