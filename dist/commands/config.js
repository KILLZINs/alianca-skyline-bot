"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConfigEmbed = buildConfigEmbed;
exports.buildConfigRows = buildConfigRows;
const discord_js_1 = require("discord.js");
const allowlist_1 = require("../utils/allowlist");
const botConfig_1 = require("../utils/botConfig");
const embeds_1 = require("../utils/embeds");
exports.default = {
    category: 'sistema',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('config')
        .setDescription('Configurar a aparência dos embeds do bot (donos e managers)'),
    async execute(interaction) {
        if (!(0, allowlist_1.isBotManager)(interaction.user.id)) {
            return interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Acesso Negado', 'Apenas donos e managers do bot podem usar este comando.')],
                ephemeral: true,
            });
        }
        const cfg = (0, botConfig_1.getBotConfig)();
        const embed = buildConfigEmbed(cfg, interaction.user.tag);
        const rows = buildConfigRows();
        await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    },
};
// ─── Helpers exportados para o handler ───────────────────────────────────────
function buildConfigEmbed(cfg, editor) {
    return new discord_js_1.EmbedBuilder()
        .setColor(cfg.primaryColor)
        .setTitle('⚙️ Configuração de Embeds')
        .setDescription('Personalize a aparência dos embeds do bot em todos os servidores.\n' +
        'As mudanças valem imediatamente para novos embeds gerados.')
        .addFields({ name: '📝 Rodapé Padrão', value: `\`${cfg.footerText}\``, inline: false }, { name: '🎨 Cor Principal', value: `\`${(0, botConfig_1.intToHex)(cfg.primaryColor)}\``, inline: true }, { name: '🖼️ Ícone do Bot', value: cfg.botIconUrl ? `[Ver link](${cfg.botIconUrl})` : '_Não definido_', inline: true }, { name: '📜 Rodapé do /rp', value: `\`${cfg.rpFooterText}\``, inline: false })
        .setThumbnail(cfg.botIconUrl ?? null)
        .setFooter({ text: editor ? `Última edição por ${editor}` : cfg.footerText })
        .setTimestamp();
}
function buildConfigRows() {
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('embedcfg:footer').setLabel('Rodapé Padrão').setEmoji('📝').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('embedcfg:color').setLabel('Cor Principal').setEmoji('🎨').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('embedcfg:icon').setLabel('Ícone do Bot').setEmoji('🖼️').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('embedcfg:rpfooter').setLabel('Rodapé /rp').setEmoji('📜').setStyle(discord_js_1.ButtonStyle.Secondary));
    const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('embedcfg:reset').setLabel('Restaurar Padrões').setEmoji('↩️').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('embedcfg:refresh').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Primary));
    return [row1, row2];
}
//# sourceMappingURL=config.js.map