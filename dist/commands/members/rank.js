"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const embeds_1 = require("../../utils/embeds");
const permissions_1 = require("../../utils/permissions");
const types_1 = require("../../types");
exports.default = {
    category: 'members',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('rank')
        .setDescription('Gerencia os ranks dos membros')
        .addSubcommand(sub => sub.setName('definir').setDescription('Define o rank de um membro (admin)')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro').setRequired(true))
        .addStringOption(opt => opt.setName('rank').setDescription('Rank').setRequired(true)
        .addChoices(...types_1.RANKS.map(r => ({ name: r, value: r })))))
        .addSubcommand(sub => sub.setName('lista').setDescription('Vê os ranks disponíveis e seus benefícios')),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'definir') {
            if (!(await (0, permissions_1.checkAdmin)(interaction)))
                return;
            const target = interaction.options.getMember('usuario');
            const newRank = interaction.options.getString('rank', true);
            if (!target)
                return interaction.reply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Membro não encontrado.')], ephemeral: true });
            await client_1.prisma.member.upsert({
                where: { discordId: target.id },
                update: { rank: newRank },
                create: { discordId: target.id, username: target.user.username, rank: newRank },
            });
            await interaction.reply({ embeds: [(0, embeds_1.successEmbed)('Rank Atualizado!', `${target} agora é ${(0, embeds_1.rankEmoji)(newRank)} **${newRank}**!`)] });
        }
        else if (sub === 'lista') {
            const rankDescriptions = {
                Recruta: 'Novo membro da aliança.',
                Membro: 'Membro confirmado. (Nv 5)',
                Veterano: 'Membro experiente. (Nv 15)',
                Elite: 'Soldado de elite. (Nv 30)',
                Capitão: 'Lidera pequenas tropas. (Nv 50)',
                Comandante: 'Comandante de batalhão. (Nv 75)',
                Líder: 'Liderança suprema da aliança.',
            };
            const list = types_1.RANKS.map(r => `${(0, embeds_1.rankEmoji)(r)} **${r}** — ${rankDescriptions[r] ?? ''}`).join('\n');
            await interaction.reply({ embeds: [(0, embeds_1.baseEmbed)(embeds_1.COLORS.PRIMARY).setTitle(`${embeds_1.EMOJIS.CROWN} Ranks — Aliança Skyline`).setDescription(list)] });
        }
    },
};
//# sourceMappingURL=rank.js.map