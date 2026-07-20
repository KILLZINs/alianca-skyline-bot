"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE LOGS — configuração via /logs
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLogsPanel = buildLogsPanel;
exports.handleLogsButton = handleLogsButton;
exports.handleLogsModal = handleLogsModal;
const discord_js_1 = require("discord.js");
const client_1 = require("../database/client");
const helpers_1 = require("../utils/helpers");
const embeds_1 = require("../utils/embeds");
const logger_1 = require("../utils/logger");
// ── Helpers ───────────────────────────────────────────────────────────
function getFlags(cfg) {
    return cfg?.logFlags ?? logger_1.LOG_ALL;
}
function flagStatus(flags, bit) {
    return (flags & bit) !== 0 ? '✅' : '❌';
}
// ── Build embed do painel ─────────────────────────────────────────────
async function buildLogsPanel(guild) {
    const cfg = await (0, helpers_1.getConfig)(guild.id);
    const flags = getFlags(cfg);
    const chan = cfg.logChannelId ? `<#${cfg.logChannelId}>` : '❌ **Não configurado**';
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.INFO)
        .setTitle('📋 Painel de Logs')
        .setDescription(`Configure o canal e as categorias de log do servidor.\n\n` +
        `📢 **Canal de logs:** ${chan}`)
        .addFields(Object.entries(logger_1.LOG_LABELS).map(([bit, { emoji, name }]) => ({
        name: `${flagStatus(flags, Number(bit))} ${emoji} ${name}`,
        value: `Bit \`${Number(bit)}\``,
        inline: true,
    })))
        .setFooter({ text: '⚔️ Use os botões abaixo para configurar' });
    const rows = [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('logs:set_channel')
            .setLabel('📌 Definir Canal')
            .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setCustomId('logs:clear_channel')
            .setLabel('🗑️ Remover Canal')
            .setStyle(discord_js_1.ButtonStyle.Danger)),
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`logs:toggle:${logger_1.LOG.MESSAGES}`)
            .setLabel(`${flagStatus(flags, logger_1.LOG.MESSAGES)} 📩 Mensagens`)
            .setStyle((flags & logger_1.LOG.MESSAGES) ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId(`logs:toggle:${logger_1.LOG.MEMBERS}`)
            .setLabel(`${flagStatus(flags, logger_1.LOG.MEMBERS)} 👥 Membros`)
            .setStyle((flags & logger_1.LOG.MEMBERS) ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId(`logs:toggle:${logger_1.LOG.MODERATION}`)
            .setLabel(`${flagStatus(flags, logger_1.LOG.MODERATION)} 🔨 Moderação`)
            .setStyle((flags & logger_1.LOG.MODERATION) ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary)),
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`logs:toggle:${logger_1.LOG.CHANNELS}`)
            .setLabel(`${flagStatus(flags, logger_1.LOG.CHANNELS)} 📢 Canais`)
            .setStyle((flags & logger_1.LOG.CHANNELS) ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId(`logs:toggle:${logger_1.LOG.VOICE}`)
            .setLabel(`${flagStatus(flags, logger_1.LOG.VOICE)} 🔊 Voz`)
            .setStyle((flags & logger_1.LOG.VOICE) ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId('logs:toggle_all')
            .setLabel(flags === logger_1.LOG_ALL ? '⬛ Desativar Tudo' : '✅ Ativar Tudo')
            .setStyle(flags === logger_1.LOG_ALL ? discord_js_1.ButtonStyle.Danger : discord_js_1.ButtonStyle.Success)),
    ];
    return { embed, rows };
}
// ═══════════════════════════════════════════════════════════════════════
// BUTTON HANDLER
// ═══════════════════════════════════════════════════════════════════════
async function handleLogsButton(i, action) {
    // Verificar permissão (ManageGuild)
    if (!i.memberPermissions?.has('ManageGuild')) {
        await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Você precisa da permissão **Gerenciar Servidor**.')], ephemeral: true });
        return;
    }
    const guild = i.guild;
    try {
        // ── Definir canal via modal ────────────────────────────────────────
        if (action === 'set_channel') {
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId('logs_modal:set_channel')
                .setTitle('📌 Definir Canal de Logs')
                .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                .setCustomId('channel_id')
                .setLabel('ID do Canal ou #menção')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setPlaceholder('Ex: 123456789012345678 ou #logs')
                .setRequired(true)
                .setMaxLength(32)));
            await i.showModal(modal);
            return;
        }
        await i.deferUpdate();
        // ── Remover canal ─────────────────────────────────────────────────
        if (action === 'clear_channel') {
            await client_1.prisma.guildConfig.upsert({
                where: { guildId: guild.id },
                update: { logChannelId: null },
                create: { guildId: guild.id, logChannelId: null },
            });
            (0, logger_1.invalidateLogCache)(guild.id);
            const { embed, rows } = await buildLogsPanel(guild);
            await i.editReply({ embeds: [embed], components: rows });
            return;
        }
        // ── Toggle de categoria ───────────────────────────────────────────
        if (action.startsWith('toggle:')) {
            const bit = parseInt(action.split(':')[1], 10);
            const cfg = await (0, helpers_1.getConfig)(guild.id);
            const flags = getFlags(cfg);
            const newFlags = (flags & bit) ? (flags & ~bit) : (flags | bit);
            await client_1.prisma.guildConfig.upsert({
                where: { guildId: guild.id },
                update: { logFlags: newFlags },
                create: { guildId: guild.id, logFlags: newFlags },
            });
            (0, logger_1.invalidateLogCache)(guild.id);
            const { embed, rows } = await buildLogsPanel(guild);
            await i.editReply({ embeds: [embed], components: rows });
            return;
        }
        // ── Toggle tudo ───────────────────────────────────────────────────
        if (action === 'toggle_all') {
            const cfg = await (0, helpers_1.getConfig)(guild.id);
            const flags = getFlags(cfg);
            const newFlags = flags === logger_1.LOG_ALL ? 0 : logger_1.LOG_ALL;
            await client_1.prisma.guildConfig.upsert({
                where: { guildId: guild.id },
                update: { logFlags: newFlags },
                create: { guildId: guild.id, logFlags: newFlags },
            });
            (0, logger_1.invalidateLogCache)(guild.id);
            const { embed, rows } = await buildLogsPanel(guild);
            await i.editReply({ embeds: [embed], components: rows });
            return;
        }
        await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Ação desconhecida', `\`${action}\``)] });
    }
    catch (err) {
        console.error('[Logs Panel Error]', err);
        const e = (0, embeds_1.errorEmbed)('Erro', 'Ocorreu um erro ao processar.');
        if (i.replied || i.deferred)
            await i.editReply({ embeds: [e] }).catch(() => null);
        else
            await i.reply({ embeds: [e], ephemeral: true }).catch(() => null);
    }
}
// ═══════════════════════════════════════════════════════════════════════
// MODAL HANDLER
// ═══════════════════════════════════════════════════════════════════════
async function handleLogsModal(i, action) {
    if (!i.memberPermissions?.has('ManageGuild')) {
        await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Você precisa da permissão **Gerenciar Servidor**.')], ephemeral: true });
        return;
    }
    const guild = i.guild;
    if (action === 'set_channel') {
        await i.deferUpdate();
        const raw = i.fields.getTextInputValue('channel_id').trim().replace(/[<#>]/g, '');
        if (!/^\d{17,20}$/.test(raw)) {
            await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('ID Inválido', 'Informe o ID numérico do canal (17-20 dígitos) ou mencione com #.')] });
            return;
        }
        const channel = guild.channels.cache.get(raw);
        if (!channel) {
            await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Canal não encontrado', `ID \`${raw}\` não encontrado neste servidor.`)] });
            return;
        }
        if (!channel.isTextBased()) {
            await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Canal inválido', 'Informe um canal de **texto**.')] });
            return;
        }
        await client_1.prisma.guildConfig.upsert({
            where: { guildId: guild.id },
            update: { logChannelId: raw },
            create: { guildId: guild.id, logChannelId: raw },
        });
        (0, logger_1.invalidateLogCache)(guild.id);
        const { embed, rows } = await buildLogsPanel(guild);
        await i.editReply({
            embeds: [(0, embeds_1.successEmbed)('✅ Canal de Logs Definido', `Os logs serão enviados para <#${raw}>.`), embed],
            components: rows,
        });
        return;
    }
    await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Ação desconhecida', action)], ephemeral: true });
}
//# sourceMappingURL=logsHandler.js.map