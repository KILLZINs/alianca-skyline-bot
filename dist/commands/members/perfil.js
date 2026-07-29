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
        .setName('perfil')
        .setDescription('Exibe o perfil de um membro')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro (padrão: você mesmo)').setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getMember('usuario') ?? interaction.member;
        const user = target.user;
        await interaction.deferReply();
        const m = await (0, helpers_1.getOrCreateMember)(user.id, user.username);
        const xpNeeded = (0, types_1.xpForNextLevel)(m.level);
        const rankPos = await client_1.prisma.member.count({ where: { OR: [{ level: { gt: m.level } }, { level: m.level, xp: { gt: m.xp } }] } });
        const achievements = await client_1.prisma.achievement.count({ where: { memberId: m.discordId } });
        const embed = (0, embeds_1.baseEmbed)((0, embeds_1.colorFromLevel)(m.level))
            .setTitle(`${embeds_1.EMOJIS.PERSON} ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields({ name: '🏅 Rank', value: `${(0, embeds_1.rankEmoji)(m.rank)} **${m.rank}**`, inline: true }, { name: '🎯 Nível', value: `**${m.level}**`, inline: true }, { name: '📊 Posição', value: `**#${rankPos + 1}**`, inline: true }, { name: '💜 XP', value: `${m.xp} / ${xpNeeded}\n\`${(0, embeds_1.levelBar)(m.xp, xpNeeded)}\``, inline: false }, { name: '🪙 Moedas', value: `**${m.coins}**`, inline: true }, { name: '🏆 Conquistas', value: `**${achievements}**`, inline: true }, { name: '⚠️ Avisos', value: `**${m.warnings}**`, inline: true }, { name: '📅 Membro desde', value: `<t:${Math.floor(m.createdAt.getTime() / 1000)}:D>`, inline: false })
            .setFooter({ text: '⚔️ Aliança Skyline' });
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=perfil.js.map