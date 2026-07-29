"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEmbedCfgButton = handleEmbedCfgButton;
exports.handleEmbedCfgModal = handleEmbedCfgModal;
const discord_js_1 = require("discord.js");
const botConfig_1 = require("../utils/botConfig");
const allowlist_1 = require("../utils/allowlist");
const embeds_1 = require("../utils/embeds");
const config_1 = require("../commands/config");
function guard(i) {
    return (0, allowlist_1.isBotManager)(i.user.id);
}
// ─── Botões ───────────────────────────────────────────────────────────────────
async function handleEmbedCfgButton(i, action) {
    if (!guard(i)) {
        return void i.reply({ embeds: [(0, embeds_1.errorEmbed)('Acesso Negado', 'Sem permissão.')], ephemeral: true });
    }
    // ── Atualizar painel ──
    if (action === 'refresh') {
        const cfg = (0, botConfig_1.getBotConfig)();
        await i.update({ embeds: [(0, config_1.buildConfigEmbed)(cfg, i.user.tag)], components: (0, config_1.buildConfigRows)() });
        return;
    }
    // ── Restaurar padrões ──
    if (action === 'reset') {
        await i.deferUpdate();
        await (0, botConfig_1.updateBotConfig)({ ...botConfig_1.CONFIG_DEFAULTS });
        const cfg = (0, botConfig_1.getBotConfig)();
        await i.editReply({ embeds: [(0, config_1.buildConfigEmbed)(cfg, i.user.tag)], components: (0, config_1.buildConfigRows)() });
        return;
    }
    // ── Abrir modal conforme ação ──
    const titles = {
        footer: '📝 Rodapé Padrão dos Embeds',
        color: '🎨 Cor Principal dos Embeds',
        icon: '🖼️ Ícone / Thumbnail do Bot',
        rpfooter: '📜 Rodapé dos Embeds de /rp',
    };
    const modal = new discord_js_1.ModalBuilder()
        .setTitle(titles[action] ?? 'Configurar')
        .setCustomId(`embedcfg_modal:${action}`);
    const cfg = (0, botConfig_1.getBotConfig)();
    let input;
    if (action === 'footer') {
        input = new discord_js_1.TextInputBuilder()
            .setCustomId('value').setLabel('Texto do rodapé (ex: ⚔️ Meu Bot)')
            .setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(100)
            .setValue(cfg.footerText);
    }
    else if (action === 'color') {
        input = new discord_js_1.TextInputBuilder()
            .setCustomId('value').setLabel('Cor em hexadecimal (ex: #9b59b6 ou 9b59b6)')
            .setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(7)
            .setValue((0, botConfig_1.intToHex)(cfg.primaryColor));
    }
    else if (action === 'icon') {
        input = new discord_js_1.TextInputBuilder()
            .setCustomId('value').setLabel('URL da imagem (deixe vazio para remover)')
            .setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setMaxLength(500)
            .setValue(cfg.botIconUrl ?? '');
    }
    else {
        // rpfooter
        input = new discord_js_1.TextInputBuilder()
            .setCustomId('value').setLabel('Texto do rodapé específico do /rp')
            .setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(100)
            .setValue(cfg.rpFooterText);
    }
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
    await i.showModal(modal);
}
// ─── Modais ───────────────────────────────────────────────────────────────────
async function handleEmbedCfgModal(i, action) {
    if (!guard(i)) {
        return void i.reply({ embeds: [(0, embeds_1.errorEmbed)('Acesso Negado', 'Sem permissão.')], ephemeral: true });
    }
    await i.deferUpdate();
    const raw = i.fields.getTextInputValue('value').trim();
    if (action === 'footer') {
        if (!raw)
            return void i.followUp({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'O texto não pode ser vazio.')], ephemeral: true });
        await (0, botConfig_1.updateBotConfig)({ footerText: raw });
    }
    else if (action === 'color') {
        const n = (0, botConfig_1.hexToInt)(raw);
        if (n === null) {
            return void i.followUp({
                embeds: [(0, embeds_1.errorEmbed)('Cor Inválida', 'Use formato hexadecimal válido, como `#9b59b6` ou `9b59b6`.')],
                ephemeral: true,
            });
        }
        await (0, botConfig_1.updateBotConfig)({ primaryColor: n });
    }
    else if (action === 'icon') {
        const url = raw || null;
        if (url && !/^https?:\/\/.+\..+/.test(url)) {
            return void i.followUp({
                embeds: [(0, embeds_1.errorEmbed)('URL Inválida', 'A URL precisa começar com `https://` e apontar para uma imagem.')],
                ephemeral: true,
            });
        }
        await (0, botConfig_1.updateBotConfig)({ botIconUrl: url });
    }
    else if (action === 'rpfooter') {
        if (!raw)
            return void i.followUp({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'O texto não pode ser vazio.')], ephemeral: true });
        await (0, botConfig_1.updateBotConfig)({ rpFooterText: raw });
    }
    const cfg = (0, botConfig_1.getBotConfig)();
    await i.editReply({ embeds: [(0, config_1.buildConfigEmbed)(cfg, i.user.tag)], components: (0, config_1.buildConfigRows)() });
}
//# sourceMappingURL=configHandler.js.map