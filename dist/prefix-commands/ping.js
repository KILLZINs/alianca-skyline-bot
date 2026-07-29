"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
exports.default = {
    name: 'ping',
    description: 'Mostra a latência do bot',
    async execute(message, _args) {
        const sent = await message.reply({ content: '🏓 Calculando...' });
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const wsLatency = message.client.ws.ping;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.SUCCESS ?? 0x00b894)
            .setTitle('🏓 Pong!')
            .addFields({ name: '📡 Latência', value: `${latency}ms`, inline: true }, { name: '💓 WebSocket', value: `${wsLatency}ms`, inline: true })
            .setFooter({ text: '⚔️ Aliança Skyline' });
        await sent.edit({ content: '', embeds: [embed] });
    },
};
//# sourceMappingURL=ping.js.map