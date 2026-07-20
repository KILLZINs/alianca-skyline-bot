"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../../utils/embeds");
exports.default = {
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder().setName('ping').setDescription('Verifica a latência do bot'),
    async execute(interaction) {
        const sent = await interaction.reply({ embeds: [(0, embeds_1.baseEmbed)().setTitle('🏓 Calculando latência...')], fetchReply: true });
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const ws = interaction.client.ws.ping;
        const color = roundtrip < 100 ? embeds_1.COLORS.SUCCESS : roundtrip < 250 ? embeds_1.COLORS.WARNING : embeds_1.COLORS.ERROR;
        const quality = roundtrip < 100 ? '🟢 Excelente' : roundtrip < 250 ? '🟡 Boa' : '🔴 Alta';
        await interaction.editReply({
            embeds: [(0, embeds_1.baseEmbed)(color)
                    .setTitle('🏓 Pong!')
                    .addFields({ name: '📡 Latência Roundtrip', value: `**${roundtrip}ms**`, inline: true }, { name: '💜 WebSocket', value: `**${ws}ms**`, inline: true }, { name: '📊 Qualidade', value: quality, inline: true })
                    .setFooter({ text: '⚔️ Aliança Skyline' })],
        });
    },
};
//# sourceMappingURL=ping.js.map