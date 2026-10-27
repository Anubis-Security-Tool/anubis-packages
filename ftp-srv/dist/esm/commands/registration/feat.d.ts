import type { CommandHandlerOptions } from '../index.js';
declare const _default: {
    directive: string;
    handler: ({ log, command }: CommandHandlerOptions) => Promise<any>;
    syntax: string;
    description: string;
    flags: {
        no_auth: boolean;
    };
};
export default _default;
