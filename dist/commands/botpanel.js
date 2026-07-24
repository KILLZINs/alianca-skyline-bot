"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBotPanelEmbed = buildBotPanelEmbed;
exports.buildBotPanelRow = buildBotPanelRow;
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
const botConfig_1 = require("../utils/botConfig");
const allowlist_1 = require("../utils/allowlist");
function buildBotPanelEmbed() {
    const cfg = (0, botConfig_1.getBotConfig)();
    return new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.DARK)
        .setTitle('🛠️ Painel de Features do Bot')
        .setDescription('Ative ou desative funcionalidades globais do bot.\nSomente donos do bot podem usar este painel.')
        .addFields({
        name: '💤 Sistema AFK',
        value: cfg.featAfk
            ? '✅ **Ativado** — `/afk` disponível, menções detectadas'
            : '❌ **Desativado** — comando e detecção desligados',
        inline: false,
    }, {
        name: '📩 DM de Boas-vindas',
        value: cfg.featWelcomeDm
            ? '✅ **Ativado** — novos membros recebem DM da aliança'
            : '❌ **Desativado** — DM não é enviada',
        inline: false,
    })
        .setFooter({ text: '⚔️ Aliança Skyline — Bot Owner Panel' })
        .setTimestamp();
}
function buildBotPanelRow() {
    const cfg = (0, botConfig_1.getBotConfig)();
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('botpanel:toggle_afk')
        .setLabel(cfg.featAfk ? 'Desativar AFK' : 'Ativar AFK')
        .setEmoji(cfg.featAfk ? '❌' : '✅')
        .setStyle(cfg.featAfk ? discord_js_1.ButtonStyle.Danger : discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId('botpanel:toggle_welcomedm')
        .setLabel(cfg.featWelcomeDm ? 'Desativar DM Boas-vindas' : 'Ativar DM Boas-vindas')
        .setEmoji(cfg.featWelcomeDm ? '❌' : '✅')
        .setStyle(cfg.featWelcomeDm ? discord_js_1.ButtonStyle.Danger : discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId('botpanel:refresh')
        .setLabel('Atualizar')
        .setEmoji('🔄')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
}
exports.default = {
    category: 'sistema',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('botpanel')
        .setDescription('Painel de controle de features globais do bot (somente donos)')
        .setDMPermission(true),
    async execute(interaction) {
        if (!(0, allowlist_1.isBotOwner)(interaction.user.id)) {
            return interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Acesso Negado', 'Apenas donos do bot podem usar este painel.')],
                ephemeral: true,
            });
        }
        await interaction.reply({
            embeds: [buildBotPanelEmbed()],
            components: [buildBotPanelRow()],
            ephemeral: true,
        });
    },
};
//# sourceMappingURL=botpanel.js.map