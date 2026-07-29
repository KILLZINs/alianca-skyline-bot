"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
const permissions_1 = require("../utils/permissions");
exports.default = {
    category: 'mod',
    data: new discord_js_1.SlashCommandBuilder().setName('mod').setDescription('Painel de moderação da Aliança Skyline'),
    async execute(interaction) {
        if (!(await (0, permissions_1.checkModerator)(interaction)))
            return;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.ERROR)
            .setTitle(`${embeds_1.EMOJIS.HAMMER} Painel de Moderação`)
            .setDescription('Selecione uma ação de moderação abaixo.\nTodas as ações são registradas no canal de logs.')
            .addFields({ name: '🔨 Ban', value: 'Banir um membro permanentemente', inline: true }, { name: '👟 Kick', value: 'Expulsar um membro do servidor', inline: true }, { name: '🔇 Mute', value: 'Silenciar membro por um tempo', inline: true }, { name: '🔊 Unmute', value: 'Remover silêncio de um membro', inline: true }, { name: '⚠️ Warn', value: 'Advertir um membro', inline: true }, { name: '📋 Warns', value: 'Ver histórico de avisos', inline: true }, { name: '🗑️ Limpar', value: 'Deletar mensagens em massa', inline: true }, { name: '🚫 Unban', value: 'Desbanir um usuário pelo ID', inline: true }, { name: '🔄 Remover Warn', value: 'Remover último aviso de um membro', inline: true })
            .setTimestamp()
            .setFooter({ text: '⚔️ Aliança Skyline — Moderação' });
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('mod:ban').setLabel('Ban').setEmoji('🔨').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('mod:kick').setLabel('Kick').setEmoji('👟').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('mod:mute').setLabel('Mute').setEmoji('🔇').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('mod:unmute').setLabel('Unmute').setEmoji('🔊').setStyle(discord_js_1.ButtonStyle.Secondary));
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('mod:warn').setLabel('Warn').setEmoji('⚠️').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('mod:warns').setLabel('Warns').setEmoji('📋').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('mod:limpar').setLabel('Limpar').setEmoji('🗑️').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('mod:unban').setLabel('Unban').setEmoji('🚫').setStyle(discord_js_1.ButtonStyle.Secondary));
        const row3 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('mod:remover_warn').setLabel('Remover Warn').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('mod:slowmode').setLabel('Slowmode').setEmoji('🐢').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('mod:lock').setLabel('Trancar Canal').setEmoji('🔒').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('mod:unlock').setLabel('Destrancar').setEmoji('🔓').setStyle(discord_js_1.ButtonStyle.Success));
        await interaction.reply({ embeds: [embed], components: [row1, row2, row3], ephemeral: true });
    },
};
//# sourceMappingURL=mod.js.map