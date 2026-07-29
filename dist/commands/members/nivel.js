"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const embeds_1 = require("../../utils/embeds");
const helpers_1 = require("../../utils/helpers");
const types_1 = require("../../types");
exports.default = {
    category: 'members',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('nivel')
        .setDescription('Exibe o nível e XP de um membro')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro (padrão: você)').setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getMember('usuario') ?? interaction.member;
        const user = target.user;
        await interaction.deferReply();
        const m = await (0, helpers_1.getOrCreateMember)(user.id, user.username);
        const xpNeeded = (0, types_1.xpForNextLevel)(m.level);
        const rankPos = await client_1.prisma.member.count({ where: { OR: [{ level: { gt: m.level } }, { level: m.level, xp: { gt: m.xp } }] } });
        const embed = (0, embeds_1.baseEmbed)((0, embeds_1.colorFromLevel)(m.level))
            .setTitle(`🎯 Nível de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(`${(0, embeds_1.rankEmoji)(m.rank)} **${m.rank}**\n\n` +
            `**Nível ${m.level}** — ${m.xp} / ${xpNeeded} XP\n\`${(0, embeds_1.levelBar)(m.xp, xpNeeded)}\`\n\n` +
            `📊 **Ranking:** #${rankPos + 1}`)
            .setFooter({ text: '⚔️ Aliança Skyline' });
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=nivel.js.map