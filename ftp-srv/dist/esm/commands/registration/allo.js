export default {
    directive: 'ALLO',
    handler: function ({ log, command }) {
        return this.reply(202, 'ALLO command not needed');
    },
    syntax: '{{cmd}}',
    description: 'Allocate storage space',
};
