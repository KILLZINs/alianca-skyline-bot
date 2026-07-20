"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
exports.default = {
    name: 'messageDelete',
    once: false,
    async execute(message) {
        if (!message.guild)
            return;
        if (message.author?.bot)
            return;
        // Ignorar mensagens de sistema / sem autor (parciais sem cache)
        if (!message.author)
            return;
        const content = message.content ?? '*(sem conteúdo)*';
        const channelName = message.channel.isDMBased() ? 'DM' : message.channel.name ?? 'desconhecido';
        const embed = (0, logger_1.logMessageDelete)(message.author, content, channelName, message.channelId);
        // Anexos deletados
        if (message.attachments.size > 0) {
            const list = message.attachments.map(a => `[${a.name}](${a.url})`).slice(0, 5).join('\n');
            embed.addFields({ name: '📎 Anexos', value: list, inline: false });
        }
        await (0, logger_1.sendLog)(message.guild, logger_1.LOG.MESSAGES, embed);
    },
};
//# sourceMappingURL=messageDelete.js.map