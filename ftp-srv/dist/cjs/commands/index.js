"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = __importDefault(require("./registry"));
const CMD_FLAG_REGEX = /^-(\w{1})$/;
class FtpCommands {
    connection;
    blacklist;
    whitelist;
    previousCommand;
    constructor(connection) {
        this.connection = connection;
        this.previousCommand = {};
        this.blacklist = (this.connection.server.options.blacklist || []).map((cmd) => cmd.toUpperCase());
        this.whitelist = (this.connection.server.options.whitelist || []).map((cmd) => cmd.toUpperCase());
    }
    parse(message) {
        const strippedMessage = message.replace(/"/g, '');
        const parts = strippedMessage.split(' ');
        let directive = parts[0]?.trim().toUpperCase() || '';
        const args = parts.slice(1);
        const parseCommandFlags = !['RETR', 'SIZE', 'STOR'].includes(directive);
        const params = args.reduce((acc, param) => {
            if (parseCommandFlags && CMD_FLAG_REGEX.test(param)) {
                acc.flags.push(param);
            }
            else {
                acc.arg.push(param);
            }
            return acc;
        }, { arg: [], flags: [] });
        return {
            directive,
            arg: params.arg.length ? params.arg.join(' ') : null,
            flags: params.flags,
            raw: message,
        };
    }
    async handle(command) {
        if (typeof command === 'string') {
            command = this.parse(command);
        }
        const logCommand = { ...command };
        if (logCommand.directive === 'PASS') {
            logCommand.arg = '********';
        }
        const log = this.connection.log.child({ directive: command.directive });
        log.trace({ command: logCommand }, 'Handle command');
        if (!(command.directive in registry_1.default)) {
            await this.connection.reply(502, `Command not allowed: ${command.directive}`);
            return;
        }
        if (this.blacklist.includes(command.directive)) {
            await this.connection.reply(502, `Command blacklisted: ${command.directive}`);
            return;
        }
        if (this.whitelist.length > 0 && !this.whitelist.includes(command.directive)) {
            await this.connection.reply(502, `Command not whitelisted: ${command.directive}`);
            return;
        }
        const commandRegister = registry_1.default[command.directive];
        const commandFlags = commandRegister?.flags || {};
        if (!commandFlags.no_auth && !this.connection.authenticated) {
            await this.connection.reply(530, `Command requires authentication: ${command.directive}`);
            return;
        }
        if (!commandRegister.handler) {
            await this.connection.reply(502, `Handler not set on command: ${command.directive}`);
            return;
        }
        const handler = commandRegister.handler.bind(this.connection);
        await handler({ log, command, previous_command: this.previousCommand });
        this.previousCommand = { ...command };
    }
}
exports.default = FtpCommands;
