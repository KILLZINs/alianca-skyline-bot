"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const embeds_1 = require("../../utils/embeds");
exports.default = {
    category: 'members',
    data: new discord_js_1.SlashCommandBuilder().setName('leaderboard').setDescription('Top 10 membros do servidor por nível e XP'),
    async execute(interaction) {
        await interaction.deferReply();
        const top = await client_1.prisma.member.findMany({ orderBy: [{ level: 'desc' }, { xp: 'desc' }], take: 10 });
        if (!top.length)
            return interaction.editReply({ embeds: [(0, embeds_1.baseEmbed)().setTitle('🏆 Ranking').setDescription('Nenhum membro encontrado.')] });
        const medals = ['🥇', '🥈', '🥉'];
        const list = top.map((m, i) => `${medals[i] ?? `**${i + 1}.**`} ${(0, embeds_1.rankEmoji)(m.rank)} **${m.username}** — Nv **${m.level}** • ${m.xp} XP`).join('\n');
        const userPos = await client_1.prisma.member.count({ where: { OR: [{ level: { gt: 0 } }] } });
        const myRank = top.findIndex(m => m.discordId === interaction.user.id) + 1;
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD)
            .setTitle(`🏆 Ranking — Aliança Skyline`)
            .setDescription(list)
            .setThumbnail(interaction.guild?.iconURL() ?? null)
            .setFooter({ text: `${myRank > 0 ? `Sua posição: #${myRank}` : 'Você não está no top 10'} • ⚔️ Aliança Skyline` });
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=leaderboard.js.map