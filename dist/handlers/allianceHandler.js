"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAliancaButton = handleAliancaButton;
exports.handleServidorButton = handleServidorButton;
exports.handleAllianceModal = handleAllianceModal;
exports.handleServidorModal = handleServidorModal;
const discord_js_1 = require("discord.js");
const client_1 = require("../database/client");
const allowlist_1 = require("../utils/allowlist");
const embeds_1 = require("../utils/embeds");
const alliance_1 = require("../utils/alliance");
function resolveId(s) { return s.replace(/[<@!&#]/g, '').trim(); }
// ─── Botões da aliança ────────────────────────────────────────────────────────
async function handleAliancaButton(i, action) {
    if (!(0, allowlist_1.isBotManager)(i.user.id)) {
        return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas administradores da aliança podem usar isso.')], ephemeral: true });
    }
    switch (action) {
        case 'add_server': {
            const modal = new discord_js_1.ModalBuilder().setCustomId('alliance_modal:add_server').setTitle('Adicionar Servidor à Aliança');
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('guild_id').setLabel('ID do Servidor (Guild ID)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('ex: 123456789012345678')), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('guild_name').setLabel('Nome do Servidor').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('invite_link').setLabel('Link de Convite (opcional)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setPlaceholder('ex: https://discord.gg/exemplo')));
            return i.showModal(modal);
        }
        case 'remove_server': {
            const modal = new discord_js_1.ModalBuilder().setCustomId('alliance_modal:remove_server').setTitle('Remover Servidor da Aliança');
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('guild_id').setLabel('ID do Servidor').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)));
            return i.showModal(modal);
        }
        case 'update_classes': {
            await i.deferReply({ ephemeral: true });
            const { updated, notFound } = await (0, alliance_1.updateAllServerClasses)(i.client);
            return i.editReply({
                embeds: [(0, embeds_1.successEmbed)('Classes Atualizadas', `**${updated}** servidor(es) atualizados.\n${notFound > 0 ? `⚠️ **${notFound}** servidor(es) não encontrados no cache (bot pode não estar neles).` : ''}`)],
            });
        }
        case 'set_member': {
            const modal = new discord_js_1.ModalBuilder().setCustomId('alliance_modal:set_member').setTitle('Definir Representante/Dono');
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('guild_id').setLabel('ID do Servidor').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('user_id').setLabel('ID do Usuário Discord').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('username').setLabel('Nome do Usuário (referência)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('role').setLabel('Cargo: owner ou representative').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('owner  ou  representative')));
            return i.showModal(modal);
        }
        case 'remove_member': {
            const modal = new discord_js_1.ModalBuilder().setCustomId('alliance_modal:remove_member').setTitle('Remover Representante/Dono');
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('guild_id').setLabel('ID do Servidor').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('user_id').setLabel('ID do Usuário').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)));
            return i.showModal(modal);
        }
        case 'view_members': {
            await i.deferReply({ ephemeral: true });
            const servers = await (0, alliance_1.getAllianceServers)();
            if (servers.length === 0) {
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Servidores', 'Nenhum servidor cadastrado na aliança.')] });
            }
            const lines = [];
            for (const s of servers) {
                const cls = (0, alliance_1.getServerClass)(s.memberCount);
                lines.push(`**${cls.emoji} ${s.guildName ?? s.guildId}**`);
                const owners = s.members.filter(m => m.role === 'owner');
                const reps = s.members.filter(m => m.role === 'representative');
                if (owners.length > 0)
                    lines.push(`👑 Donos: ${owners.map(m => `<@${m.userId}>`).join(', ')}`);
                if (reps.length > 0)
                    lines.push(`🎖️ Reps: ${reps.map(m => `<@${m.userId}>`).join(', ')}`);
                if (owners.length === 0 && reps.length === 0)
                    lines.push('*Nenhum cadastrado*');
                lines.push('');
            }
            const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.PRIMARY)
                .setTitle('👥 Representantes e Donos — Aliança Skyline')
                .setDescription(lines.join('\n').slice(0, 4000) || '*Vazio*');
            return i.editReply({ embeds: [embed] });
        }
        case 'analysis': {
            await i.deferReply({ ephemeral: true });
            const servers = await (0, alliance_1.getAllianceServers)();
            if (servers.length === 0) {
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Dados', 'Nenhum servidor cadastrado.')] });
            }
            const lines = [];
            for (const s of servers) {
                const cls = (0, alliance_1.getServerClass)(s.memberCount);
                const hasLink = s.inviteLink ? '✅' : '❌';
                const hasCh = s.channelId ? '✅' : '❌';
                // Verificar se canal ainda existe no Discord
                let chStatus = '❌ Não configurado';
                if (s.channelId) {
                    const guild = i.client.guilds.cache.get(s.guildId);
                    const ch = guild?.channels.cache.get(s.channelId);
                    chStatus = ch ? `✅ <#${s.channelId}>` : '⚠️ Canal não encontrado';
                }
                const link = s.inviteLink ? `[🔗 Convite](${s.inviteLink})` : '🔗 Sem link';
                lines.push(`**${cls.emoji} ${s.guildName ?? s.guildId}**  •  ${s.memberCount.toLocaleString('pt-BR')} membros\n` +
                    `> Classe: **${cls.name}** | Link: ${hasLink} | Canal: ${chStatus}\n` +
                    `> ${link} | ID: \`${s.guildId}\``);
            }
            const totalMembers = servers.reduce((a, s) => a + s.memberCount, 0);
            const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
                .setTitle('📊 Análise — Servidores da Aliança Skyline')
                .setDescription(lines.join('\n\n').slice(0, 4000))
                .addFields({
                name: '📋 Totais',
                value: `**${servers.length}** servidores • **${totalMembers.toLocaleString('pt-BR')}** membros`,
            });
            return i.editReply({ embeds: [embed] });
        }
        case 'send_embed': {
            const modal = new discord_js_1.ModalBuilder().setCustomId('alliance_modal:send_embed').setTitle('Enviar Embed Oficial');
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('channel_id').setLabel('ID do Canal onde enviar').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('ex: 987654321098765432')));
            return i.showModal(modal);
        }
        case 'update_embed': {
            await i.deferReply({ ephemeral: true });
            const records = await client_1.prisma.allianceEmbed.findMany();
            if (records.length === 0) {
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Embed', 'Nenhum embed oficial enviado ainda. Use **Enviar Embed** primeiro.')] });
            }
            const newEmbed = await (0, alliance_1.buildOfficialAllianceEmbed)(i.client);
            let updatedCount = 0;
            for (const rec of records) {
                const guild = i.client.guilds.cache.get(rec.guildId);
                if (!guild)
                    continue;
                const ch = guild.channels.cache.get(rec.channelId);
                if (!ch)
                    continue;
                const msg = await ch.messages.fetch(rec.messageId).catch(() => null);
                if (!msg)
                    continue;
                await msg.edit({ embeds: [newEmbed] }).catch(() => null);
                await client_1.prisma.allianceEmbed.update({ where: { id: rec.id }, data: { updatedAt: new Date() } });
                updatedCount++;
            }
            return i.editReply({
                embeds: [(0, embeds_1.successEmbed)('Embed Atualizado', `**${updatedCount}** embed(s) atualizado(s) em ${records.length} local(is).`)],
            });
        }
        case 'blacklist_add': {
            const modal = new discord_js_1.ModalBuilder().setCustomId('alliance_modal:blacklist_add').setTitle('Adicionar à Blacklist');
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('user_id').setLabel('ID do Usuário').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('username').setLabel('Nome do Usuário (referência)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('reason').setLabel('Motivo').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(false)));
            return i.showModal(modal);
        }
        case 'blacklist_remove': {
            const modal = new discord_js_1.ModalBuilder().setCustomId('alliance_modal:blacklist_remove').setTitle('Remover da Blacklist');
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('user_id').setLabel('ID do Usuário').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)));
            return i.showModal(modal);
        }
    }
}
// ─── Botões do servidor ───────────────────────────────────────────────────────
async function handleServidorButton(i, action) {
    if (!i.guild)
        return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'Use em um servidor.')], ephemeral: true });
    const member = i.member;
    const isOwner = i.guild.ownerId === i.user.id;
    const isMgr = member.permissions.has('ManageGuild');
    if (!isOwner && !isMgr) {
        return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas donos ou gerentes do servidor podem usar isso.')], ephemeral: true });
    }
    const guildId = i.guild.id;
    const allianceServer = await client_1.prisma.allianceServer.findUnique({ where: { guildId } });
    if (!allianceServer) {
        return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Não Cadastrado', 'Este servidor não está na aliança.')], ephemeral: true });
    }
    switch (action) {
        case 'set_channel': {
            const modal = new discord_js_1.ModalBuilder().setCustomId('servidor_modal:set_channel').setTitle('Definir Canal da Aliança');
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('channel_id').setLabel('ID do Canal da Aliança neste servidor').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('ex: 111222333444555666')));
            return i.showModal(modal);
        }
        case 'set_invite': {
            const modal = new discord_js_1.ModalBuilder().setCustomId('servidor_modal:set_invite').setTitle('Definir Link de Convite');
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('invite_link').setLabel('Link de Convite permanente').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('ex: https://discord.gg/exemplo')));
            return i.showModal(modal);
        }
        case 'performance': {
            await i.deferReply({ ephemeral: true });
            // Stats dos últimos 7 dias
            const now = new Date();
            const dates7d = [];
            for (let d = 0; d < 7; d++) {
                const dt = new Date(now);
                dt.setDate(dt.getDate() - d);
                dates7d.push(dt.toISOString().slice(0, 10));
            }
            const stats = await client_1.prisma.serverStat.findMany({
                where: { guildId, date: { in: dates7d } },
                orderBy: { date: 'desc' },
            });
            const totalJoins7d = stats.reduce((a, s) => a + s.joins, 0);
            const totalLeaves7d = stats.reduce((a, s) => a + s.leaves, 0);
            const avgPerDay = stats.length > 0 ? (totalJoins7d / stats.length).toFixed(1) : '0';
            const cls = (0, alliance_1.getServerClass)(allianceServer.memberCount);
            const next = (0, alliance_1.getNextClass)(allianceServer.memberCount);
            const statsLines = stats.slice(0, 7).map(s => `\`${s.date}\` +${s.joins} -${s.leaves}`).join('\n') || '*Sem dados disponíveis*';
            const embed = (0, embeds_1.baseEmbed)(cls.color)
                .setTitle(`📊 Desempenho — ${i.guild.name}`)
                .setThumbnail(i.guild.iconURL() ?? null)
                .addFields({ name: '🏷️ Classe Atual', value: `${cls.emoji} **${cls.name}**`, inline: true }, { name: '👥 Membros Atual', value: `**${allianceServer.memberCount.toLocaleString('pt-BR')}**`, inline: true }, { name: '📈 Entradas (7 dias)', value: `**+${totalJoins7d}**`, inline: true }, { name: '📉 Saídas (7 dias)', value: `**-${totalLeaves7d}**`, inline: true }, { name: '📊 Média Diária (Entradas)', value: `**${avgPerDay}**/dia`, inline: true }, {
                name: next ? `🚀 Próxima Classe: ${next.cls.emoji} ${next.cls.name}` : '🏆 Classe Máxima!',
                value: next ? `Faltam **${next.needed.toLocaleString('pt-BR')}** membros` : 'Você está no topo da aliança!',
                inline: false,
            }, { name: '📅 Histórico (últimos 7 dias)', value: statsLines, inline: false });
            return i.editReply({ embeds: [embed] });
        }
    }
}
// ─── Modais da aliança ────────────────────────────────────────────────────────
async function handleAllianceModal(i, action) {
    if (!(0, allowlist_1.isBotManager)(i.user.id)) {
        return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas administradores da aliança podem usar isso.')], ephemeral: true });
    }
    await i.deferReply({ ephemeral: true });
    const getField = (id) => {
        try {
            return i.fields.getTextInputValue(id).trim() || null;
        }
        catch {
            return null;
        }
    };
    switch (action) {
        case 'add_server': {
            const guildId = resolveId(getField('guild_id') ?? '');
            const guildName = getField('guild_name');
            const invite = getField('invite_link');
            if (!guildId)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'ID do servidor inválido.')] });
            // Tentar pegar info real do servidor se bot estiver nele
            const discordGuild = i.client.guilds.cache.get(guildId);
            const finalName = discordGuild?.name ?? guildName ?? guildId;
            const memberCount = discordGuild?.memberCount ?? 0;
            const cls = (0, alliance_1.getServerClass)(memberCount);
            await client_1.prisma.allianceServer.upsert({
                where: { guildId },
                update: { guildName: finalName, memberCount, class: cls.name, inviteLink: invite },
                create: { guildId, guildName: finalName, memberCount, class: cls.name, inviteLink: invite, addedBy: i.user.id },
            });
            return i.editReply({
                embeds: [(0, embeds_1.successEmbed)('Servidor Adicionado', `**${finalName}** foi adicionado à aliança!\nClasse: ${cls.emoji} **${cls.name}** (${memberCount.toLocaleString('pt-BR')} membros)`)],
            });
        }
        case 'remove_server': {
            const guildId = resolveId(getField('guild_id') ?? '');
            if (!guildId)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'ID inválido.')] });
            const existing = await client_1.prisma.allianceServer.findUnique({ where: { guildId } });
            if (!existing)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Servidor não está na aliança.')] });
            await client_1.prisma.allianceServer.delete({ where: { guildId } });
            return i.editReply({ embeds: [(0, embeds_1.successEmbed)('Removido', `**${existing.guildName ?? guildId}** foi removido da aliança.`)] });
        }
        case 'set_member': {
            const guildId = resolveId(getField('guild_id') ?? '');
            const userId = resolveId(getField('user_id') ?? '');
            const username = getField('username');
            const roleRaw = (getField('role') ?? '').toLowerCase();
            const role = roleRaw === 'owner' ? 'owner' : 'representative';
            if (!guildId || !userId)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'ID do servidor ou usuário inválido.')] });
            const server = await client_1.prisma.allianceServer.findUnique({ where: { guildId } });
            if (!server)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Servidor não está na aliança.')] });
            await client_1.prisma.allianceServerMember.upsert({
                where: { guildId_userId: { guildId, userId } },
                update: { role, username: username ?? undefined },
                create: { guildId, userId, role, username: username ?? undefined },
            });
            const roleLabel = role === 'owner' ? '👑 Dono' : '🎖️ Representante';
            return i.editReply({ embeds: [(0, embeds_1.successEmbed)('Definido', `<@${userId}> foi definido como **${roleLabel}** de **${server.guildName ?? guildId}**.`)] });
        }
        case 'remove_member': {
            const guildId = resolveId(getField('guild_id') ?? '');
            const userId = resolveId(getField('user_id') ?? '');
            if (!guildId || !userId)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'IDs inválidos.')] });
            const deleted = await client_1.prisma.allianceServerMember.deleteMany({ where: { guildId, userId } });
            if (deleted.count === 0)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Usuário não é rep/dono neste servidor.')] });
            return i.editReply({ embeds: [(0, embeds_1.successEmbed)('Removido', `<@${userId}> foi removido de **${guildId}**.`)] });
        }
        case 'send_embed': {
            const channelId = resolveId(getField('channel_id') ?? '');
            if (!channelId)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'ID de canal inválido.')] });
            const guildId = i.guildId ?? '';
            const guild = i.client.guilds.cache.get(guildId) ?? i.guild;
            const channel = (guild ?? i.client.guilds.cache.first())?.channels.cache.get(channelId);
            if (!channel)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Canal não encontrado', `Canal \`${channelId}\` não encontrado neste servidor.`)] });
            const allianceEmbed = await (0, alliance_1.buildOfficialAllianceEmbed)(i.client);
            const msg = await channel.send({ embeds: [allianceEmbed] });
            await client_1.prisma.allianceEmbed.upsert({
                where: { guildId: channel.guildId },
                update: { channelId, messageId: msg.id, updatedAt: new Date() },
                create: { guildId: channel.guildId, channelId, messageId: msg.id, updatedAt: new Date() },
            });
            return i.editReply({ embeds: [(0, embeds_1.successEmbed)('Embed Enviado', `Embed oficial enviado em <#${channelId}>!`)] });
        }
        case 'blacklist_add': {
            const userId = resolveId(getField('user_id') ?? '');
            const username = getField('username');
            const reason = getField('reason');
            if (!userId)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'ID de usuário inválido.')] });
            await client_1.prisma.allianceBlacklist.upsert({
                where: { userId },
                update: { username: username ?? undefined, reason: reason ?? undefined, addedBy: i.user.id },
                create: { userId, username: username ?? undefined, reason: reason ?? undefined, addedBy: i.user.id },
            });
            // Banir de todos os servidores da aliança automaticamente
            const servers = await client_1.prisma.allianceServer.findMany();
            let bannedFrom = 0;
            for (const s of servers) {
                const guild = i.client.guilds.cache.get(s.guildId);
                if (!guild)
                    continue;
                const member = guild.members.cache.get(userId) ?? await guild.members.fetch(userId).catch(() => null);
                if (!member)
                    continue;
                await guild.bans.create(userId, { reason: `[Blacklist Aliança] ${reason ?? 'Sem motivo'}` }).catch(() => null);
                bannedFrom++;
            }
            return i.editReply({
                embeds: [(0, embeds_1.successEmbed)('Blacklist — Adicionado', `<@${userId}> (${username ?? userId}) foi adicionado à blacklist.\n` +
                        `🔨 Banido de **${bannedFrom}** servidor(es) da aliança.\n` +
                        `${reason ? `📝 Motivo: ${reason}` : ''}`)],
            });
        }
        case 'blacklist_remove': {
            const userId = resolveId(getField('user_id') ?? '');
            if (!userId)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'ID inválido.')] });
            const existing = await client_1.prisma.allianceBlacklist.findUnique({ where: { userId } });
            if (!existing)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Usuário não está na blacklist.')] });
            await client_1.prisma.allianceBlacklist.delete({ where: { userId } });
            return i.editReply({ embeds: [(0, embeds_1.successEmbed)('Blacklist — Removido', `<@${userId}> foi removido da blacklist da aliança.`)] });
        }
    }
}
// ─── Modais do servidor (dono do server) ─────────────────────────────────────
async function handleServidorModal(i, action) {
    if (!i.guild)
        return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'Use em um servidor.')], ephemeral: true });
    const member = i.member;
    const isOwner = i.guild.ownerId === i.user.id;
    const isMgr = member.permissions.has('ManageGuild');
    if (!isOwner && !isMgr) {
        return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas donos ou gerentes do servidor.')], ephemeral: true });
    }
    await i.deferReply({ ephemeral: true });
    const getField = (id) => {
        try {
            return i.fields.getTextInputValue(id).trim() || null;
        }
        catch {
            return null;
        }
    };
    const guildId = i.guild.id;
    const server = await client_1.prisma.allianceServer.findUnique({ where: { guildId } });
    if (!server)
        return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não Cadastrado', 'Servidor não está na aliança.')] });
    switch (action) {
        case 'set_channel': {
            const channelId = resolveId(getField('channel_id') ?? '');
            if (!channelId)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'ID de canal inválido.')] });
            const channel = i.guild.channels.cache.get(channelId);
            if (!channel)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', `Canal \`${channelId}\` não encontrado neste servidor.`)] });
            await client_1.prisma.allianceServer.update({ where: { guildId }, data: { channelId } });
            return i.editReply({ embeds: [(0, embeds_1.successEmbed)('Canal Definido', `Canal da aliança definido como <#${channelId}>!`)] });
        }
        case 'set_invite': {
            const invite = getField('invite_link');
            if (!invite)
                return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'Link inválido.')] });
            await client_1.prisma.allianceServer.update({ where: { guildId }, data: { inviteLink: invite } });
            return i.editReply({ embeds: [(0, embeds_1.successEmbed)('Link Definido', `Link de convite salvo:\n${invite}`)] });
        }
    }
}
//# sourceMappingURL=allianceHandler.js.map