"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSelect = handleSelect;
const discord_js_1 = require("discord.js");
const client_1 = require("../database/client");
const helpers_1 = require("../utils/helpers");
const embeds_1 = require("../utils/embeds");
async function handleSelect(interaction) {
    const parts = interaction.customId.split(':');
    const prefix = parts[0];
    const action = parts[1];
    try {
        if (prefix === 'ticket' && action === 'category')
            return await ticketCategory(interaction);
        if (prefix === 'rpg_select')
            return await (await Promise.resolve().then(() => __importStar(require('./../rpg/handlers/rpgSelectHandler')))).handleRpgSelect(interaction, action);
        if (prefix === 'selfrole' && action === 'choose')
            return await selfRoleChoose(interaction);
        if (prefix === 'selfrole' && action === 'add')
            return await selfRoleAdd(interaction);
        if (prefix === 'selfrole' && action === 'remove')
            return await selfRoleRemove(interaction);
        if (prefix === 'selfrole_admin')
            return await selfRoleAdminSelect(interaction, action, parts);
    }
    catch (err) {
        console.error('Select error:', err);
        const e = (0, embeds_1.errorEmbed)('Erro', 'Ocorreu um erro ao processar esta ação.');
        if (interaction.replied || interaction.deferred)
            await interaction.followUp({ embeds: [e], ephemeral: true });
        else
            await interaction.reply({ embeds: [e], ephemeral: true });
    }
}
async function ticketCategory(i) {
    await i.deferReply({ ephemeral: true });
    const category = i.values[0];
    const guild = i.guild;
    const user = i.user;
    const existing = await client_1.prisma.ticket.findFirst({ where: { authorId: user.id, status: 'open' } });
    if (existing) {
        const ch = guild.channels.cache.get(existing.channelId);
        if (ch)
            return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Ticket Existente', `Você já tem um ticket aberto: ${ch}`)] });
        await client_1.prisma.ticket.delete({ where: { id: existing.id } });
    }
    const config = await (0, helpers_1.getConfig)(guild.id);
    const labels = {
        suporte: '🛠️ Suporte Geral', parceria: '🤝 Parceria',
        reporte: '🚨 Reporte', candidatura: '📋 Candidatura', outro: '❓ Outro',
    };
    const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}-${category}`;
    const ticketCh = await guild.channels.create({
        name: channelName,
        type: discord_js_1.ChannelType.GuildText,
        parent: config.ticketCategoryId ?? undefined,
        permissionOverwrites: [
            { id: guild.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            { id: user.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory, discord_js_1.PermissionFlagsBits.AttachFiles] },
            ...(config.modRoleId ? [{ id: config.modRoleId, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory, discord_js_1.PermissionFlagsBits.ManageMessages] }] : []),
            ...(config.adminRoleId ? [{ id: config.adminRoleId, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory, discord_js_1.PermissionFlagsBits.ManageMessages] }] : []),
        ],
    });
    const ticket = await client_1.prisma.ticket.create({ data: { channelId: ticketCh.id, authorId: user.id, category } });
    const embed = (0, embeds_1.baseEmbed)()
        .setTitle(`${embeds_1.EMOJIS.TICKET} ${labels[category] ?? category}`)
        .setDescription(`Olá ${user}! Descreva seu problema e aguarde um moderador.\n\n**Categoria:** ${labels[category] ?? category}`)
        .addFields({ name: '📌 Autor', value: `${user} (${user.id})`, inline: true }, { name: '🏷️ Categoria', value: labels[category] ?? category, inline: true })
        .setTimestamp();
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`ticket:close:${ticket.id}`).setLabel('Fechar Ticket').setEmoji('🔒').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId(`ticket:claim:${ticket.id}`).setLabel('Assumir Ticket').setEmoji('🛡️').setStyle(discord_js_1.ButtonStyle.Primary));
    const ping = config.modRoleId ? `<@&${config.modRoleId}>` : '';
    await ticketCh.send({ content: `${user} ${ping}`.trim(), embeds: [embed], components: [row] });
    if (config.ticketLogChannelId) {
        const logCh = guild.channels.cache.get(config.ticketLogChannelId);
        if (logCh) {
            await logCh.send({ embeds: [(0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO).setTitle('🎫 Novo Ticket').addFields({ name: 'Autor', value: `${user} (${user.id})`, inline: true }, { name: 'Categoria', value: labels[category] ?? category, inline: true }, { name: 'Canal', value: `${ticketCh}`, inline: true })] });
        }
    }
    await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Ticket Criado!', `Seu ticket foi aberto em ${ticketCh}`)] });
}
// ── Selfrole — toggle legado (backward compat com mensagens antigas) ─────────
async function selfRoleChoose(i) {
    const roleId = i.values[0];
    await i.deferReply({ ephemeral: true });
    const member = i.member;
    if (!member)
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('❌ Não foi possível verificar seu perfil.')] });
    const role = i.guild?.roles.cache.get(roleId);
    if (!role)
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('❌ Este cargo não existe mais no servidor.')] });
    const hasRole = member.roles.cache.has(roleId);
    try {
        if (hasRole) {
            await member.roles.remove(roleId);
            return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription(`❌ O cargo ${role} foi **removido** do seu perfil.`)] });
        }
        else {
            await member.roles.add(roleId);
            return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0x2ECC71).setDescription(`✅ O cargo ${role} foi **adicionado** ao seu perfil!`)] });
        }
    }
    catch {
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('❌ Não foi possível alterar o cargo. Verifique se o bot tem permissão de gerenciar cargos.')] });
    }
}
// ── Selfrole — adicionar cargo explicitamente ─────────────────────────────────
async function selfRoleAdd(i) {
    const roleId = i.values[0];
    await i.deferReply({ ephemeral: true });
    const member = i.member;
    if (!member)
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('❌ Não foi possível verificar seu perfil.')] });
    const role = i.guild?.roles.cache.get(roleId);
    if (!role)
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('❌ Este cargo não existe mais no servidor.')] });
    if (member.roles.cache.has(roleId)) {
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xF39C12).setDescription(`⚠️ Você já possui o cargo ${role}. Use o menu **🗑️ Remover** para removê-lo.`)] });
    }
    try {
        await member.roles.add(roleId);
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0x2ECC71).setDescription(`✅ O cargo ${role} foi **adicionado** ao seu perfil!`)] });
    }
    catch {
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('❌ Não foi possível adicionar o cargo. Verifique se o bot tem permissão de gerenciar cargos.')] });
    }
}
// ── Selfrole — remover cargo explicitamente ───────────────────────────────────
async function selfRoleRemove(i) {
    const roleId = i.values[0];
    await i.deferReply({ ephemeral: true });
    const member = i.member;
    if (!member)
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('❌ Não foi possível verificar seu perfil.')] });
    const role = i.guild?.roles.cache.get(roleId);
    if (!role)
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('❌ Este cargo não existe mais no servidor.')] });
    if (!member.roles.cache.has(roleId)) {
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xF39C12).setDescription(`⚠️ Você não possui o cargo ${role}.`)] });
    }
    try {
        await member.roles.remove(roleId);
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription(`🗑️ O cargo ${role} foi **removido** do seu perfil.`)] });
    }
    catch {
        return i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('❌ Não foi possível remover o cargo. Verifique se o bot tem permissão de gerenciar cargos.')] });
    }
}
// ── Selfrole Admin — select menu handlers ────────────────────────────────────
async function selfRoleAdminSelect(i, action, parts) {
    const { checkAdmin } = await Promise.resolve().then(() => __importStar(require('../utils/permissions')));
    if (!(await checkAdmin(i)))
        return;
    await i.deferUpdate();
    const guildId = i.guildId;
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../database/client')));
    const { errorEmbed, successEmbed, baseEmbed } = await Promise.resolve().then(() => __importStar(require('../utils/embeds')));
    const COLORS = { DARK: 0x2C3E50 };
    // ── canal_for_criar: abre modal de título/descrição após escolher canal ──
    if (action === 'channel_for_criar') {
        const chanId = i.values[0];
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: AR } = await Promise.resolve().then(() => __importStar(require('discord.js')));
        const modal = new ModalBuilder()
            .setCustomId(`cargo_menu:criar:${chanId}`)
            .setTitle('Criar Menu de Cargos — Passo 2/2');
        modal.addComponents(new AR().addComponents(new TextInputBuilder().setCustomId('titulo').setLabel('Título do menu').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100).setPlaceholder('Ex: 🎭 Escolha seus cargos')), new AR().addComponents(new TextInputBuilder().setCustomId('descricao').setLabel('Descrição (opcional)').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(500)));
        return i.followUp({ content: '\u200b', components: [] }).then(() => i.showModal(modal)).catch(async () => {
            // fallback: can't show modal after deferUpdate, send follow-up with instructions
            await i.editReply({ embeds: [new discord_js_1.EmbedBuilder().setColor(0x3498DB).setTitle('Passo 2 — Defina o Título').setDescription(`Canal selecionado: <#${chanId}>\n\nComo não é possível abrir um modal após selecionar o canal, clique em **🆕 Criar Menu** novamente e desta vez use o canal <#${chanId}>. Vamos melhorar isso em breve!`)], components: [] });
        });
    }
    // ── menu_for_add: escolheu o menu, mostrar seletor de cargo ──────────────
    if (action === 'menu_for_add') {
        const menuId = i.values[0];
        const menu = await prisma.selfRoleMenu.findUnique({ where: { id: menuId }, include: { entries: true } });
        if (!menu)
            return i.editReply({ embeds: [errorEmbed('Menu não encontrado', 'Este menu não existe mais.')], components: [] });
        if (menu.entries.length >= 25)
            return i.editReply({ embeds: [errorEmbed('Limite', 'Este menu já tem 25 cargos (máximo).')], components: [] });
        const embed = new discord_js_1.EmbedBuilder().setColor(COLORS.DARK)
            .setTitle(`➕ Adicionar Cargo — ${menu.title}`)
            .setDescription(`Selecione o **cargo** que deseja adicionar.\n> Atualmente: **${menu.entries.length}** cargo(s)`);
        const { RoleSelectMenuBuilder: RSM, ActionRowBuilder: AR2 } = await Promise.resolve().then(() => __importStar(require('discord.js')));
        const roleSelect = new AR2().addComponents(new RSM().setCustomId(`selfrole_admin:add_role:${menuId}`).setPlaceholder('🎭 Selecione o cargo a adicionar...'));
        return i.editReply({ embeds: [embed], components: [roleSelect] });
    }
    // ── add_role: recebe o cargo selecionado pelo RoleSelectMenu ─────────────
    if (action === 'add_role') {
        const menuId = parts[2];
        const roleId = i.values[0];
        const role = i.guild?.roles.cache.get(roleId);
        if (!role)
            return i.editReply({ embeds: [errorEmbed('Cargo inválido', 'Este cargo não foi encontrado.')], components: [] });
        const menu = await prisma.selfRoleMenu.findUnique({ where: { id: menuId }, include: { entries: true } });
        if (!menu)
            return i.editReply({ embeds: [errorEmbed('Menu não encontrado', 'Este menu não existe mais.')], components: [] });
        if (menu.entries.length >= 25)
            return i.editReply({ embeds: [errorEmbed('Limite', 'Este menu já atingiu o máximo de 25 cargos.')], components: [] });
        if (menu.entries.some(e => e.roleId === roleId))
            return i.editReply({ embeds: [errorEmbed('Já existe', `O cargo ${role} já está neste menu.`)], components: [] });
        const label = role.name.slice(0, 80);
        await prisma.selfRoleEntry.create({ data: { menuId, roleId, label, emoji: null } });
        const count = await prisma.selfRoleEntry.count({ where: { menuId } });
        const { ButtonBuilder: BB, ButtonStyle: BS, ActionRowBuilder: AR3 } = await Promise.resolve().then(() => __importStar(require('discord.js')));
        const row = new AR3().addComponents(new BB().setCustomId(`selfrole_admin:confirm_pub:${menuId}`).setLabel('📤 Publicar Agora').setStyle(BS.Success));
        return i.editReply({
            embeds: [new discord_js_1.EmbedBuilder().setColor(0x2ECC71).setTitle('✅ Cargo Adicionado!').setDescription(`**${role.name}** adicionado ao menu **${menu.title}**.\nTotal: **${count}** cargo(s).\n\nClique em **📤 Publicar Agora** para atualizar o menu, ou feche para publicar depois.`)],
            components: [row],
        });
    }
    // ── menu_for_rem: escolheu o menu, mostrar lista de entradas ─────────────
    if (action === 'menu_for_rem') {
        const menuId = i.values[0];
        const menu = await prisma.selfRoleMenu.findUnique({ where: { id: menuId }, include: { entries: true } });
        if (!menu)
            return i.editReply({ embeds: [errorEmbed('Menu não encontrado', 'Este menu não existe mais.')], components: [] });
        if (!menu.entries.length)
            return i.editReply({ embeds: [errorEmbed('Menu Vazio', 'Este menu não tem cargos para remover.')], components: [] });
        const embed = new discord_js_1.EmbedBuilder().setColor(COLORS.DARK)
            .setTitle(`🗑️ Remover Cargo — ${menu.title}`)
            .setDescription('Selecione o cargo que deseja remover:');
        const { StringSelectMenuBuilder: SSM, StringSelectMenuOptionBuilder: SSOB, ActionRowBuilder: AR4 } = await Promise.resolve().then(() => __importStar(require('discord.js')));
        const entrySelect = new AR4().addComponents(new SSM()
            .setCustomId(`selfrole_admin:rem_entry:${menuId}`)
            .setPlaceholder('🗑️ Selecione o cargo a remover...')
            .addOptions(menu.entries.map(e => new SSOB().setValue(e.id).setLabel(e.label.slice(0, 100)).setDescription(`ID: ${e.roleId}`).setEmoji({ name: '🏷️' }))));
        return i.editReply({ embeds: [embed], components: [entrySelect] });
    }
    // ── rem_entry: recebe a entrada a remover ─────────────────────────────────
    if (action === 'rem_entry') {
        const menuId = parts[2];
        const entryId = i.values[0];
        const entry = await prisma.selfRoleEntry.findUnique({ where: { id: entryId } });
        if (!entry)
            return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Esta entrada não existe mais.')], components: [] });
        await prisma.selfRoleEntry.delete({ where: { id: entryId } });
        const remaining = await prisma.selfRoleEntry.count({ where: { menuId } });
        const { ButtonBuilder: BB2, ButtonStyle: BS2, ActionRowBuilder: AR5 } = await Promise.resolve().then(() => __importStar(require('discord.js')));
        const row = new AR5().addComponents(new BB2().setCustomId(`selfrole_admin:confirm_pub:${menuId}`).setLabel('📤 Publicar Agora').setStyle(BS2.Primary));
        return i.editReply({
            embeds: [new discord_js_1.EmbedBuilder().setColor(0x2ECC71).setTitle('✅ Cargo Removido!').setDescription(`**${entry.label}** removido do menu.\nRestam **${remaining}** cargo(s).\n\nClique em **📤 Publicar Agora** para atualizar o menu.`)],
            components: [row],
        });
    }
    // ── menu_for_pub: escolheu o menu, mostrar botão de confirmação ──────────
    if (action === 'menu_for_pub') {
        const menuId = i.values[0];
        const menu = await prisma.selfRoleMenu.findUnique({ where: { id: menuId }, include: { entries: true } });
        if (!menu)
            return i.editReply({ embeds: [errorEmbed('Menu não encontrado', 'Este menu não existe mais.')], components: [] });
        if (!menu.entries.length)
            return i.editReply({ embeds: [errorEmbed('Menu Vazio', 'Adicione pelo menos um cargo antes de publicar.')], components: [] });
        const embed = new discord_js_1.EmbedBuilder().setColor(COLORS.DARK)
            .setTitle(`📤 Publicar — ${menu.title}`)
            .setDescription(`Canal: <#${menu.channelId}>\n` +
            `Cargos: **${menu.entries.length}**\n` +
            (menu.messageId ? '> ✅ Já publicado — será **atualizado**.' : '> ⏳ Ainda não publicado — será **enviado**.') +
            '\n\nConfirme para publicar:')
            .addFields({ name: '🏷️ Cargos no menu', value: menu.entries.map(e => `${e.emoji ?? '•'} ${e.label}`).join('\n').slice(0, 1000) || 'Nenhum' });
        const { ButtonBuilder: BB3, ButtonStyle: BS3, ActionRowBuilder: AR6 } = await Promise.resolve().then(() => __importStar(require('discord.js')));
        const row = new AR6().addComponents(new BB3().setCustomId(`selfrole_admin:confirm_pub:${menuId}`).setLabel('✅ Confirmar Publicação').setStyle(BS3.Success));
        return i.editReply({ embeds: [embed], components: [row] });
    }
}
//# sourceMappingURL=selectHandler.js.map