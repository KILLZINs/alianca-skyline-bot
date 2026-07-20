"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../../utils/embeds");
exports.default = {
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder().setName('serverinfo').setDescription('Exibe informações sobre o servidor'),
    async execute(interaction) {
        const g = interaction.guild;
        await interaction.deferReply();
        await g.fetch();
        const owner = await g.fetchOwner().catch(() => null);
        const channels = g.channels.cache;
        const textCh = channels.filter(c => c.type === 0).size;
        const voiceCh = channels.filter(c => c.type === 2).size;
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.PRIMARY)
            .setTitle(`📊 ${g.name}`)
            .setThumbnail(g.iconURL({ size: 256 }) ?? null)
            .addFields({ name: '🆔 ID', value: g.id, inline: true }, { name: '👑 Dono', value: owner ? `${owner.user.tag}` : 'Desconhecido', inline: true }, { name: '📅 Criado em', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true }, { name: '👥 Membros', value: `**${g.memberCount}**`, inline: true }, { name: '💎 Boosts', value: `**${g.premiumSubscriptionCount ?? 0}** (Tier ${g.premiumTier})`, inline: true }, { name: '🌍 Locale', value: g.preferredLocale, inline: true }, { name: '💬 Canais de Texto', value: `**${textCh}**`, inline: true }, { name: '🔊 Canais de Voz', value: `**${voiceCh}**`, inline: true }, { name: '📋 Cargos', value: `**${g.roles.cache.size}**`, inline: true }, { name: '😀 Emojis', value: `**${g.emojis.cache.size}**`, inline: true }, { name: '✅ Verificação', value: `**${g.verificationLevel}**`, inline: true })
            .setFooter({ text: '⚔️ Aliança Skyline' });
        if (g.bannerURL())
            embed.setImage(g.bannerURL({ size: 1024 }));
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=serverinfo.js.map