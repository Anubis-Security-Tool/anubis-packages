/**
 * Choose the address to advertise in a PASV reply.
 *
 * The client opens the data connection to whatever address we return, so
 * 127.0.0.1 only works for a client running on this same machine. When the
 * server listens on a wildcard address we must therefore pick a real interface
 * address - ideally one that shares a subnet with the client.
 */
export declare function resolvePasvIp(connection: any): string;
