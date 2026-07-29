"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGuildMenuEmbed = buildGuildMenuEmbed;
exports.buildGuildMenuButtons = buildGuildMenuButtons;
exports.buildGuildInfoButtons = buildGuildInfoButtons;
exports.guildConfigModal = guildConfigModal;
exports.guildDepositarModal = guildDepositarModal;
exports.guildAnuncioModal = guildAnuncioModal;
exports.buildGuildInfoEmbed = buildGuildInfoEmbed;
exports.buildGuildListEmbed = buildGuildListEmbed;
exports.criarGuildaModal = criarGuildaModal;
exports.createGuild = createGuild;
exports.joinGuild = joinGuild;
exports.leaveGuild = leaveGuild;
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
function buildGuildMenuEmbed(char) {
    return new discord_js_1.EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('🏛️ Sistema de Guilda RPG')
        .setDescription('Junte-se a uma guilda para batalhar junto, compartilhar recursos e dominar as dungeons!')
        .addFields({ name: '🆕 Criar Guilda', value: 'Funde sua própria guilda com tag e emblema únicos', inline: true }, { name: '🔍 Buscar Guilda', value: 'Procure e entre em uma guilda existente', inline: true }, { name: '📋 Minha Guilda', value: 'Veja info e gerencie sua guilda atual', inline: true })
        .setFooter({ text: '⚔️ Aliança Skyline RPG — Guilds' });
}
function buildGuildMenuButtons(hasMembership) {
    return new discord_js_1.ActionRowBuilder().addComponents(...(hasMembership ? [
        new discord_js_1.ButtonBuilder().setCustomId('rpg:guild_info').setLabel('📋 Minha Guilda').setStyle(discord_js_1.ButtonStyle.Primary),
        new discord_js_1.ButtonBuilder().setCustomId('rpg:guild_sair').setLabel('🚪 Sair da Guilda').setStyle(discord_js_1.ButtonStyle.Danger),
    ] : [
        new discord_js_1.ButtonBuilder().setCustomId('rpg:guild_criar').setLabel('🆕 Criar Guilda').setStyle(discord_js_1.ButtonStyle.Success),
        new discord_js_1.ButtonBuilder().setCustomId('rpg:guild_buscar').setLabel('🔍 Buscar Guilds').setStyle(discord_js_1.ButtonStyle.Primary),
    ]), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary));
}
/** Botões exibidos na tela de info da guilda — líderes/vice-líderes veem botões de gestão */
function buildGuildInfoButtons(role) {
    const isManager = role === 'Líder' || role === 'Vice-Líder';
    const rows = [];
    if (isManager) {
        rows.push(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:guild_config').setLabel('⚙️ Configurar').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:guild_anuncio').setLabel('📢 Aviso').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:guild_depositar').setLabel('💰 Depositar Ouro').setStyle(discord_js_1.ButtonStyle.Success)));
    }
    rows.push(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:guild_info').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:guild_sair').setLabel('🚪 Sair da Guilda').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('rpg:guild').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary)));
    return rows;
}
function guildConfigModal() {
    const modal = new discord_js_1.ModalBuilder().setCustomId('rpg_modal:guild_config').setTitle('Configurar Guilda');
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('nome').setLabel('Novo Nome (deixe em branco para manter)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setMinLength(3).setMaxLength(30)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('descricao').setLabel('Nova Descrição').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(false).setMaxLength(200)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('emblema').setLabel('Novo Emblema (1 emoji)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setMaxLength(4)));
    return modal;
}
function guildDepositarModal() {
    const modal = new discord_js_1.ModalBuilder().setCustomId('rpg_modal:guild_depositar').setTitle('Depositar Ouro na Guilda');
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
        .setCustomId('quantidade')
        .setLabel('Quantidade de Ouro a Depositar')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('Ex: 500')));
    return modal;
}
function guildAnuncioModal() {
    const modal = new discord_js_1.ModalBuilder().setCustomId('rpg_modal:guild_anuncio').setTitle('Definir Aviso da Guilda');
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
        .setCustomId('aviso')
        .setLabel('Mensagem de Aviso (deixe em branco para limpar)')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(300)));
    return modal;
}
async function buildGuildInfoEmbed(guildId) {
    const guild = await client_1.prisma.rpgGuild.findUnique({
        where: { id: guildId },
        include: { members: { include: { character: true } } },
    });
    if (!guild) {
        return new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setDescription('Guilda não encontrada.');
    }
    const memberLines = guild.members
        .sort((a, b) => {
        const order = ['Líder', 'Vice-Líder', 'Oficial', 'Membro'];
        return order.indexOf(a.role) - order.indexOf(b.role);
    })
        .slice(0, 15)
        .map(m => {
        if (!m.character)
            return null; // defensive: personagem deletado mas membro ainda existe
        const roleEmoji = m.role === 'Líder' ? '👑' : m.role === 'Vice-Líder' ? '⭐' : m.role === 'Oficial' ? '🛡️' : '👤';
        return `${roleEmoji} **${m.character.username}** — Lv.${m.character.level} ${m.character.class}`;
    })
        .filter(Boolean)
        .join('\n');
    return new discord_js_1.EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle(`${guild.emblem} Guilda: ${guild.name} [${guild.tag}]`)
        .setDescription(guild.description ?? '*Sem descrição.*')
        .addFields({ name: '📊 Nível da Guilda', value: `**${guild.level}**`, inline: true }, { name: '💰 Ouro da Guilda', value: `**${guild.gold.toLocaleString('pt-BR')}**`, inline: true }, { name: '👥 Membros', value: `**${guild.members.length}/${guild.maxMembers}**`, inline: true }, { name: '📋 Membros', value: memberLines || '*Sem membros*', inline: false }, ...(guild.announcement ? [{ name: '📢 Aviso', value: guild.announcement, inline: false }] : []))
        .setFooter({ text: `⚔️ Fundada por ${guild.members.find(m => m.role === 'Líder')?.character?.username ?? '?'}` });
}
async function buildGuildListEmbed() {
    const guilds = await client_1.prisma.rpgGuild.findMany({
        include: { members: true },
        orderBy: { level: 'desc' },
        take: 10,
    });
    const lines = guilds.map((g, i) => `**${i + 1}.** ${g.emblem} **${g.name}** [${g.tag}] — Nv.${g.level} | ${g.members.length}/${g.maxMembers} membros`).join('\n') || '*Nenhuma guilda criada ainda. Seja o primeiro!*';
    return new discord_js_1.EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('🏛️ Top Guilds')
        .setDescription(lines)
        .setFooter({ text: 'Use Criar Guilda para fundar a sua!' });
}
function criarGuildaModal() {
    const modal = new discord_js_1.ModalBuilder().setCustomId('rpg_modal:guild_criar').setTitle('Criar Guilda');
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('nome').setLabel('Nome da Guilda').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMinLength(3).setMaxLength(30)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('tag').setLabel('Tag (3-5 letras)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMinLength(2).setMaxLength(5)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('descricao').setLabel('Descrição').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(false).setMaxLength(200)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('emblema').setLabel('Emblema (1 emoji)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setPlaceholder('⚔️').setMaxLength(4)));
    return modal;
}
async function createGuild(discordId, nome, tag, descricao, emblema) {
    const existing = await client_1.prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
    if (existing)
        return { success: false, message: 'Você já faz parte de uma guilda. Saia primeiro.' };
    const tagUpper = tag.toUpperCase();
    const nameExists = await client_1.prisma.rpgGuild.findFirst({ where: { OR: [{ name: nome }, { tag: tagUpper }] } });
    if (nameExists)
        return { success: false, message: 'Já existe uma guilda com esse nome ou tag.' };
    const guild = await client_1.prisma.rpgGuild.create({
        data: {
            name: nome, tag: tagUpper,
            description: descricao || null,
            leaderId: discordId,
            emblem: emblema || '⚔️',
            members: { create: { characterId: discordId, role: 'Líder' } },
        },
    });
    return { success: true, message: `${emblema || '⚔️'} Guilda **${nome}** [${tagUpper}] criada com sucesso!` };
}
async function joinGuild(discordId, guildId) {
    const existing = await client_1.prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
    if (existing)
        return { success: false, message: 'Você já faz parte de uma guilda.' };
    const guild = await client_1.prisma.rpgGuild.findUnique({ where: { id: guildId }, include: { members: true } });
    if (!guild)
        return { success: false, message: 'Guilda não encontrada.' };
    if (guild.members.length >= guild.maxMembers)
        return { success: false, message: 'Guilda está cheia!' };
    await client_1.prisma.rpgGuildMember.create({ data: { characterId: discordId, guildId } });
    return { success: true, message: `✅ Você entrou na guilda **${guild.emblem} ${guild.name}**!` };
}
async function leaveGuild(discordId) {
    const membership = await client_1.prisma.rpgGuildMember.findUnique({ where: { characterId: discordId }, include: { guild: true } });
    if (!membership)
        return { success: false, message: 'Você não faz parte de nenhuma guilda.' };
    if (membership.role === 'Líder') {
        const others = await client_1.prisma.rpgGuildMember.findMany({ where: { guildId: membership.guildId, characterId: { not: discordId } } });
        if (others.length > 0) {
            await client_1.prisma.rpgGuildMember.update({ where: { id: others[0].id }, data: { role: 'Líder' } });
        }
        else {
            await client_1.prisma.rpgGuild.delete({ where: { id: membership.guildId } });
            return { success: true, message: '✅ Guilda dissolvida (você era o único membro).' };
        }
    }
    await client_1.prisma.rpgGuildMember.delete({ where: { characterId: discordId } });
    return { success: true, message: `✅ Você saiu da guilda **${membership.guild.name}**.` };
}
//# sourceMappingURL=guild.js.map