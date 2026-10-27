import type FtpConnection from '../connection.js';
export interface ParsedCommand {
    directive: string;
    arg: string | null;
    flags: string[];
    raw: string;
}
export interface CommandHandlerOptions {
    log: any;
    command: ParsedCommand;
    previous_command: any;
}
declare class FtpCommands {
    connection: FtpConnection;
    blacklist: string[];
    whitelist: string[];
    previousCommand: any;
    constructor(connection: FtpConnection);
    parse(message: string): ParsedCommand;
    handle(command: string | ParsedCommand): Promise<void>;
}
export default FtpCommands;
