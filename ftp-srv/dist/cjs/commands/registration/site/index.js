"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chmod_1 = __importDefault(require("./chmod"));
const registry = {
    CHMOD: chmod_1.default,
};
exports.default = {
    directive: 'SITE',
    handler: async function ({ log, command }) {
        if (!command.arg)
            return this.reply(501, 'No SITE command provided');
        const [subCmd, ...args] = command.arg.split(' ');
        const upperCmd = subCmd.toUpperCase();
        const subCommand = registry[upperCmd];
        if (!subCommand) {
            return this.reply(502, `SITE command ${upperCmd} not implemented`);
        }
        if (!subCommand.handler) {
            return this.reply(502, `Handler not set on SITE ${upperCmd}`);
        }
        const handler = subCommand.handler.bind(this);
        return handler({
            log,
            command: {
                directive: upperCmd,
                arg: args.join(' '),
                flags: [],
                raw: command.arg,
            },
            previous_command: this.previousCommand,
        });
    },
    syntax: '{{cmd}} <subcommand>',
    description: 'Site-specific commands',
};
