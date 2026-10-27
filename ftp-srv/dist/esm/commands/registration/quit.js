export default {
    directive: 'QUIT',
    handler: async function ({ log, command }) {
        return this.close(221, 'Goodbye');
    },
    syntax: '{{cmd}}',
    description: 'Close connection',
    flags: {
        no_auth: true,
    },
};
