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
exports.handleButton = handleButton;
const discord_js_1 = require("discord.js");
const client_1 = require("../database/client");
const embeds_1 = require("../utils/embeds");
const helpers_1 = require("../utils/helpers");
const features_1 = require("../utils/features");
const types_1 = require("../types");
const permissions_1 = require("../utils/permissions");
const missoes_1 = require("../commands/utility/missoes");
const allowlist_1 = require("../utils/allowlist");
async function handleButton(interaction) {
    const parts = interaction.customId.split(':');
    const prefix = parts[0];
    const action = parts[1];
    const extra = parts.slice(2);
    try {
        switch (prefix) {
            case 'painel': return await painelButtons(interaction, action);
            case 'refresh': return await refreshButtons(interaction, action);
            case 'admin': return await adminButtons(interaction, action);
            case 'allowlist': return await allowlistButtons(interaction, action);
            case 'mod': return await modButtons(interaction, action);
            case 'ticket': return await ticketButtons(interaction, action, extra);
            case 'config': return await configButtons(interaction, action, extra);
            case 'poll': return await pollVote(interaction, extra);
            case 'giveaway': return await giveawayJoin(interaction, extra);
            case 'event': return await eventJoin(interaction, extra);
            case 'loja': return await lojaButtons(interaction, action, extra);
            case 'missoes': return await missoesButtons(interaction, action);
            case 'economia': return await economiaButtons(interaction, action);
            case 'rpg': return await (await Promise.resolve().then(() => __importStar(require('./../rpg/handlers/rpgButtonHandler')))).handleRpgButton(interaction, action);
            case 'rpgwipe': return await rpgwipeButtons(interaction, action);
            case 'alianca': return await (await Promise.resolve().then(() => __importStar(require('./allianceHandler')))).handleAliancaButton(interaction, action);
            case 'servidor': return await (await Promise.resolve().then(() => __importStar(require('./allianceHandler')))).handleServidorButton(interaction, action);
            case 'embedcfg': return await (await Promise.resolve().then(() => __importStar(require('./configHandler')))).handleEmbedCfgButton(interaction, action);
            case 'embeds': return await (await Promise.resolve().then(() => __importStar(require('./embedsHandler')))).handleEmbedsButtonRaw(interaction);
            case 'logs': return await (await Promise.resolve().then(() => __importStar(require('./logsHandler')))).handleLogsButton(interaction, action);
            case 'selfrole': return await selfRoleToggle(interaction, extra);
            case 'selfrole_admin': return await selfRoleAdminButtons(interaction, action, extra);
        }
    }
    catch (err) {
        console.error('Button error:', err);
        const e = (0, embeds_1.errorEmbed)('Erro', 'Ocorreu um erro ao processar esta ação.');
        try {
            if (interaction.replied || interaction.deferred)
                await interaction.followUp({ embeds: [e], ephemeral: true });
            else
                await interaction.reply({ embeds: [e], ephemeral: true });
        }
        catch { /* ignore */ }
    }
}
// ─── PAINEL ──────────────────────────────────────────────────────────────────
async function painelButtons(i, action) {
    const guild = i.guild;
    if (action === 'perfil') {
        await i.deferReply({ ephemeral: true });
        const m = await (0, helpers_1.getOrCreateMember)(i.user.id, i.user.username);
        const xpNeeded = (0, types_1.xpForNextLevel)(m.level);
        const rankPos = await client_1.prisma.member.count({ where: { OR: [{ level: { gt: m.level } }, { level: m.level, xp: { gt: m.xp } }] } });
        const achievements = await client_1.prisma.achievement.count({ where: { memberId: m.discordId } });
        const totalWins = await client_1.prisma.giveaway.count({ where: { winnerIds: { has: m.discordId } } });
        const embed = (0, embeds_1.baseEmbed)((0, embeds_1.colorFromLevel)(m.level))
            .setTitle(`${embeds_1.EMOJIS.PERSON} Perfil — ${i.user.username}`)
            .setThumbnail(i.user.displayAvatarURL({ size: 256 }))
            .addFields({ name: '🏅 Rank', value: `${(0, embeds_1.rankEmoji)(m.rank)} **${m.rank}**`, inline: true }, { name: '🎯 Nível', value: `**${m.level}**`, inline: true }, { name: '📊 Posição', value: `**#${rankPos + 1}**`, inline: true }, { name: '💜 XP', value: `${m.xp}/${xpNeeded}\n\`${(0, embeds_1.levelBar)(m.xp, xpNeeded)}\``, inline: false }, { name: '🪙 Moedas', value: `**${m.coins.toLocaleString('pt-BR')}**`, inline: true }, { name: '🏆 Conquistas', value: `**${achievements}**`, inline: true }, { name: '⚠️ Avisos', value: `**${m.warnings}**`, inline: true }, { name: '🎁 Sorteios Ganhos', value: `**${totalWins}**`, inline: true }, { name: '📅 Membro desde', value: `<t:${Math.floor(m.createdAt.getTime() / 1000)}:D>`, inline: true });
        return i.editReply({ embeds: [embed] });
    }
    if (action === 'nivel') {
        await i.deferReply({ ephemeral: true });
        const m = await (0, helpers_1.getOrCreateMember)(i.user.id, i.user.username);
        const xpNeeded = (0, types_1.xpForNextLevel)(m.level);
        const rankPos = await client_1.prisma.member.count({ where: { OR: [{ level: { gt: m.level } }, { level: m.level, xp: { gt: m.xp } }] } });
        const nextReward = await client_1.prisma.levelReward.findFirst({ where: { guildId: guild.id, level: { gt: m.level } }, orderBy: { level: 'asc' } });
        const embed = (0, embeds_1.baseEmbed)((0, embeds_1.colorFromLevel)(m.level))
            .setTitle(`${embeds_1.EMOJIS.LEVEL} Nível — ${i.user.username}`)
            .setThumbnail(i.user.displayAvatarURL())
            .setDescription(`${(0, embeds_1.rankEmoji)(m.rank)} **${m.rank}**\n\n` +
            `**Nível ${m.level}** — ${m.xp}/${xpNeeded} XP\n\`${(0, embeds_1.levelBar)(m.xp, xpNeeded)}\`\n\n` +
            `📊 Posição global: **#${rankPos + 1}**`)
            .addFields({ name: '📈 XP Total acumulado', value: `**${m.xp + Array.from({ length: m.level - 1 }, (_, i) => (0, types_1.xpForNextLevel)(i + 1)).reduce((a, b) => a + b, 0)}** XP`, inline: true }, { name: '🎯 Próxima recomp.', value: nextReward ? `Nível **${nextReward.level}** → <@&${nextReward.roleId}>` : 'Nenhuma configurada', inline: true });
        return i.editReply({ embeds: [embed] });
    }
    if (action === 'ranking') {
        await i.deferReply({ ephemeral: true });
        const top = await client_1.prisma.member.findMany({ orderBy: [{ level: 'desc' }, { xp: 'desc' }], take: 10 });
        const medals = ['🥇', '🥈', '🥉'];
        const list = top.map((m, idx) => `${medals[idx] ?? `**${idx + 1}.**`} ${(0, embeds_1.rankEmoji)(m.rank)} **${m.username}** — Nv ${m.level} • ${m.xp} XP`).join('\n');
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD).setTitle(`${embeds_1.EMOJIS.TROPHY} Top 10 — Ranking`).setDescription(list || 'Nenhum membro.');
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('refresh:ranking').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('refresh:ranking_coins').setLabel('Mais Ricos').setEmoji('🪙').setStyle(discord_js_1.ButtonStyle.Primary));
        return i.editReply({ embeds: [embed], components: [row] });
    }
    if (action === 'ranking_coins') {
        await i.deferReply({ ephemeral: true });
        const top = await client_1.prisma.member.findMany({ orderBy: { coins: 'desc' }, take: 10 });
        const medals = ['🥇', '🥈', '🥉'];
        const list = top.map((m, idx) => `${medals[idx] ?? `**${idx + 1}.**`} **${m.username}** — ${embeds_1.EMOJIS.COINS} ${m.coins.toLocaleString('pt-BR')} moedas`).join('\n');
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD).setTitle(`${embeds_1.EMOJIS.TROPHY} Top 10 — Mais Ricos`).setDescription(list || 'Nenhum membro.');
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('refresh:ranking').setLabel('Por XP').setEmoji('💜').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('refresh:ranking_coins').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.editReply({ embeds: [embed], components: [row] });
    }
    if (action === 'conquistas') {
        await i.deferReply({ ephemeral: true });
        const list = await client_1.prisma.achievement.findMany({ where: { memberId: i.user.id }, orderBy: { earnedAt: 'desc' }, take: 15 });
        const desc = list.length
            ? list.map(a => `${embeds_1.EMOJIS.TROPHY} **${a.name}**${a.description ? ` — ${a.description}` : ''}\n> <t:${Math.floor(a.earnedAt.getTime() / 1000)}:D>`).join('\n\n')
            : 'Você ainda não tem conquistas. Complete missões e participe de eventos!';
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD)
            .setTitle(`${embeds_1.EMOJIS.TROPHY} Conquistas — ${i.user.username}`)
            .setDescription(desc)
            .setFooter({ text: `${list.length} conquista(s) • ⚔️ Aliança Skyline` });
        return i.editReply({ embeds: [embed] });
    }
    if (action === 'economia') {
        await i.deferReply({ ephemeral: true });
        const m = await (0, helpers_1.getOrCreateMember)(i.user.id, i.user.username);
        const pos = await client_1.prisma.member.count({ where: { coins: { gt: m.coins } } });
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD)
            .setTitle(`${embeds_1.EMOJIS.COINS} Economia — ${i.user.username}`)
            .addFields({ name: `${embeds_1.EMOJIS.COINS} Saldo`, value: `**${m.coins.toLocaleString('pt-BR')}** moedas`, inline: true }, { name: '📊 Posição', value: `**#${pos + 1}** mais rico`, inline: true }, { name: `${embeds_1.EMOJIS.LEVEL} Nível`, value: `**${m.level}**`, inline: true })
            .setFooter({ text: '⚔️ Aliança Skyline' });
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('economia:transferir').setLabel('Transferir').setEmoji('💸').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('painel:ranking_coins').setLabel('Top Ricos').setEmoji('🏆').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.editReply({ embeds: [embed], components: [row] });
    }
    if (action === 'loja') {
        await i.deferReply({ ephemeral: true });
        const items = await client_1.prisma.shopItem.findMany({ where: { guildId: guild.id, active: true }, orderBy: { price: 'asc' } });
        if (!items.length) {
            return i.editReply({ embeds: [(0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO).setTitle(`${embeds_1.EMOJIS.COINS} Loja`).setDescription('Nenhum item disponível no momento.')] });
        }
        const list = items.map(item => {
            const stock = item.stock === -1 ? '∞' : `${item.stock}`;
            return `${embeds_1.EMOJIS.COINS} **${item.name}** — **${item.price.toLocaleString('pt-BR')}** moedas (estoque: ${stock})\n> ${item.description}${item.roleId ? ` • <@&${item.roleId}>` : ''}`;
        }).join('\n\n');
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD).setTitle(`${embeds_1.EMOJIS.COINS} Loja`).setDescription(list).setFooter({ text: `${items.length} item(ns) • ⚔️ Aliança Skyline` });
        const buyRow = new discord_js_1.ActionRowBuilder().addComponents(...items.slice(0, 4).map(item => new discord_js_1.ButtonBuilder().setCustomId(`loja:comprar:${item.id}`).setLabel(item.name.slice(0, 20)).setEmoji('🛒').setStyle(discord_js_1.ButtonStyle.Success)));
        const components = [buyRow];
        return i.editReply({ embeds: [embed], components });
    }
    if (action === 'missoes') {
        await i.deferReply({ ephemeral: true });
        await (0, missoes_1.ensureDailyMissions)(i.user.id, guild.id);
        const today = new Date().toISOString().slice(0, 10);
        const missions = await client_1.prisma.dailyMission.findMany({ where: { memberId: i.user.id, guildId: guild.id, dateStr: today } });
        const lines = missions.map(m => {
            const bar = buildBar(m.progress, m.target);
            const status = m.completed ? (m.claimed ? '✅ Resgatada' : '🎁 **Concluída!**') : `${m.progress}/${m.target}`;
            return `**${missionLabel(m.type)}**\n\`${bar}\` ${status}\n> ${embeds_1.EMOJIS.XP} +${m.xpReward} XP • ${embeds_1.EMOJIS.COINS} +${m.coinReward} moedas`;
        }).join('\n\n');
        const pending = missions.some(m => m.completed && !m.claimed);
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO)
            .setTitle(`${embeds_1.EMOJIS.FIRE} Missões Diárias — ${today}`)
            .setDescription(lines || 'Nenhuma missão disponível.')
            .setFooter({ text: '⚔️ Aliança Skyline • Renovam à meia-noite' });
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('missoes:resgatar').setLabel('Resgatar').setEmoji('🎁').setStyle(pending ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary).setDisabled(!pending), new discord_js_1.ButtonBuilder().setCustomId('refresh:missoes').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.editReply({ embeds: [embed], components: [row] });
    }
    if (action === 'servidor') {
        await i.deferReply({ ephemeral: true });
        const g = guild;
        const today = new Date().toISOString().slice(0, 10);
        const [totalMembers, config, stat] = await Promise.all([
            client_1.prisma.member.count(),
            (0, helpers_1.getConfig)(g.id),
            client_1.prisma.serverStat.findUnique({ where: { guildId_date: { guildId: g.id, date: today } } }),
        ]);
        const bots = g.members.cache.filter(m => m.user.bot).size;
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO)
            .setTitle(`${embeds_1.EMOJIS.CHART} ${g.name}`)
            .setThumbnail(g.iconURL() ?? null)
            .addFields({ name: '👥 Membros', value: `**${g.memberCount}** (${bots} bots)`, inline: true }, { name: '📊 No banco', value: `**${totalMembers}**`, inline: true }, { name: '💬 Canais', value: `**${g.channels.cache.size}**`, inline: true }, { name: '🎭 Cargos', value: `**${g.roles.cache.size}**`, inline: true }, { name: '😀 Emojis', value: `**${g.emojis.cache.size}**`, inline: true }, { name: '🚀 Boosts', value: `**${g.premiumSubscriptionCount ?? 0}** (Tier ${g.premiumTier})`, inline: true }, { name: '📅 Criado em', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true }, { name: '👑 Dono', value: `<@${g.ownerId}>`, inline: true }, { name: '📋 Log', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Não configurado', inline: true }, { name: `📈 Hoje — Entradas`, value: `**${stat?.joins ?? 0}**`, inline: true }, { name: `📉 Hoje — Saídas`, value: `**${stat?.leaves ?? 0}**`, inline: true }, { name: `🔨 Hoje — Bans`, value: `**${stat?.bans ?? 0}**`, inline: true }, { name: `💬 Hoje — Mensagens`, value: `**${(stat?.messages ?? 0).toLocaleString('pt-BR')}**`, inline: true });
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('painel:rede').setLabel('Rede Aliança').setEmoji('🌐').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('refresh:servidor').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.editReply({ embeds: [embed], components: [row] });
    }
    if (action === 'rede') {
        await i.deferReply({ ephemeral: true });
        const today = new Date().toISOString().slice(0, 10);
        const guilds = i.client.guilds.cache;
        const guildIds = [...guilds.keys()];
        const stats = await client_1.prisma.serverStat.findMany({ where: { guildId: { in: guildIds }, date: today } });
        const statMap = new Map(stats.map(s => [s.guildId, s]));
        let totalHumans = 0, totalBots = 0, totalJoins = 0, totalLeaves = 0, totalBans = 0, totalMsgs = 0;
        const lines = [];
        for (const [id, g] of guilds) {
            const humans = g.memberCount - g.members.cache.filter(m => m.user.bot).size;
            const bots = g.members.cache.filter(m => m.user.bot).size;
            const s = statMap.get(id);
            totalHumans += humans;
            totalBots += bots;
            totalJoins += s?.joins ?? 0;
            totalLeaves += s?.leaves ?? 0;
            totalBans += s?.bans ?? 0;
            totalMsgs += s?.messages ?? 0;
            lines.push(`**${g.name}** — ${g.memberCount} membros` +
                (s ? ` • +${s.joins}/${s.leaves}/${s.bans}🔨` : ''));
        }
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
            .setTitle(`🌐 Rede Aliança Skyline — ${guilds.size} servidor(es)`)
            .addFields({ name: '👥 Total de membros', value: `**${(totalHumans + totalBots).toLocaleString('pt-BR')}** (${totalBots} bots)`, inline: true }, { name: '📈 Hoje — Entradas', value: `**${totalJoins}**`, inline: true }, { name: '📉 Hoje — Saídas', value: `**${totalLeaves}**`, inline: true }, { name: '🔨 Hoje — Bans', value: `**${totalBans}**`, inline: true }, { name: '💬 Hoje — Mensagens', value: `**${totalMsgs.toLocaleString('pt-BR')}**`, inline: true }, { name: `📋 Servidores (${guilds.size})`, value: lines.slice(0, 10).join('\n') || '—', inline: false })
            .setFooter({ text: `+entradas/saídas/bans hoje • ⚔️ Aliança Skyline` });
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('refresh:rede').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.editReply({ embeds: [embed], components: [row] });
    }
    if (action === 'ticket') {
        await i.deferReply({ ephemeral: true });
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.PRIMARY)
            .setTitle(`${embeds_1.EMOJIS.TICKET} Suporte`)
            .setDescription('Selecione uma opção abaixo:');
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('ticket:open').setLabel('Abrir Ticket').setEmoji('🎫').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('painel:sugestao').setLabel('Sugestão').setEmoji('💡').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('painel:feedback').setLabel('Feedback').setEmoji('📝').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.editReply({ embeds: [embed], components: [row] });
    }
    if (action === 'sugestao') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:sugestaosubmit').setTitle('Enviar Sugestão');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('titulo').setLabel('Título da sugestão').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(100)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('descricao').setLabel('Descreva sua sugestão').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)));
        return i.showModal(modal);
    }
    if (action === 'feedback') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:feedbacksubmit').setTitle('Enviar Feedback');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('nota').setLabel('Nota (1-10)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(2)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('mensagem').setLabel('Seu feedback').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)));
        return i.showModal(modal);
    }
    if (action === 'sorteios') {
        await i.deferReply({ ephemeral: true });
        const ativos = await client_1.prisma.giveaway.findMany({ where: { guildId: guild.id, ended: false }, orderBy: { endsAt: 'asc' }, take: 5 });
        const desc = ativos.length
            ? ativos.map(g => `🎁 **${g.prize}** — ${g.winners} vencedor(es)\n> Encerra <t:${Math.floor(g.endsAt.getTime() / 1000)}:R>`).join('\n\n')
            : 'Nenhum sorteio ativo no momento.';
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD).setTitle(`${embeds_1.EMOJIS.GIFT} Sorteios Ativos`).setDescription(desc);
        return i.editReply({ embeds: [embed] });
    }
    if (action === 'eventos') {
        await i.deferReply({ ephemeral: true });
        const ativos = await client_1.prisma.event.findMany({ where: { guildId: guild.id, ended: false }, orderBy: { startsAt: 'asc' }, take: 5 });
        const desc = ativos.length
            ? ativos.map(e => {
                return `📌 **${e.title}**${e.description ? `\n> ${e.description}` : ''}\n> Começa <t:${Math.floor(e.startsAt.getTime() / 1000)}:R>`;
            }).join('\n\n')
            : 'Nenhum evento ativo no momento.';
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO).setTitle(`${embeds_1.EMOJIS.PIN} Eventos Ativos`).setDescription(desc);
        return i.editReply({ embeds: [embed] });
    }
    if (action === 'ping') {
        await i.deferReply({ ephemeral: true });
        const ws = i.client.ws.ping;
        const color = ws < 100 ? embeds_1.COLORS.SUCCESS : ws < 250 ? embeds_1.COLORS.WARNING : embeds_1.COLORS.ERROR;
        const quality = ws < 100 ? '🟢 Excelente' : ws < 250 ? '🟡 Boa' : '🔴 Alta';
        const embed = (0, embeds_1.baseEmbed)(color)
            .setTitle('🏓 Pong!')
            .addFields({ name: '💜 WebSocket', value: `**${ws}ms**`, inline: true }, { name: '📊 Qualidade', value: quality, inline: true }, { name: '🤖 Uptime', value: (0, helpers_1.formatDuration)(i.client.uptime ?? 0), inline: true }, { name: '🖥️ Servidores', value: `**${i.client.guilds.cache.size}**`, inline: true }, { name: '👥 Usuários', value: `**${i.client.users.cache.size}**`, inline: true });
        return i.editReply({ embeds: [embed] });
    }
}
// ─── ADMIN ────────────────────────────────────────────────────────────────────
async function adminButtons(i, action) {
    if (!(await (0, permissions_1.checkAdmin)(i)))
        return;
    const guild = i.guild;
    if (action === 'config') {
        const config = await (0, helpers_1.getConfig)(guild.id);
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
            .setTitle(`${embeds_1.EMOJIS.GEAR} Configurações do Servidor`)
            .addFields({ name: '📋 Canais', value: [
                `Log: ${config.logChannelId ? `<#${config.logChannelId}>` : '❌'}`,
                `Boas-vindas: ${config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : '❌'}`,
                `Level-up: ${config.levelUpChannelId ? `<#${config.levelUpChannelId}>` : '❌'}`,
                `Anúncios: ${config.announcementChannelId ? `<#${config.announcementChannelId}>` : '❌'}`,
                `Sugestões: ${config.suggestionChannelId ? `<#${config.suggestionChannelId}>` : '❌'}`,
                `Feedback: ${config.feedbackChannelId ? `<#${config.feedbackChannelId}>` : '❌'}`,
                `Ticket Log: ${config.ticketLogChannelId ? `<#${config.ticketLogChannelId}>` : '❌'}`,
            ].join('\n'), inline: true }, { name: '🎭 Cargos', value: [
                `Admin: ${config.adminRoleId ? `<@&${config.adminRoleId}>` : '❌'}`,
                `Mod: ${config.modRoleId ? `<@&${config.modRoleId}>` : '❌'}`,
                `Membro: ${config.memberRoleId ? `<@&${config.memberRoleId}>` : '❌'}`,
                `Auto: ${config.autoRoleId ? `<@&${config.autoRoleId}>` : '❌'}`,
            ].join('\n'), inline: true }, { name: '⚡ XP', value: [
                `Min/Max: **${config.xpMin}–${config.xpMax}** por msg`,
                `Cooldown: **${config.xpCooldown}s**`,
                `Anti-spam: **${config.antiSpam ? '✅' : '❌'}**`,
                `Anti-links: **${config.antiLinks ? '✅' : '❌'}**`,
            ].join('\n'), inline: false });
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('config:channels').setLabel('Canais').setEmoji('📋').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('config:roles').setLabel('Cargos').setEmoji('🎭').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('config:xp').setLabel('XP & Anti-spam').setEmoji('⚡').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('config:welcome').setLabel('Boas-vindas').setEmoji('👋').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.reply({ embeds: [embed], components: [row1], ephemeral: true });
    }
    if (action === 'modulos') {
        if (!(await (0, permissions_1.checkAdmin)(i)))
            return;
        await i.deferReply({ ephemeral: true });
        const cfg = await (0, helpers_1.getConfig)(guild.id);
        const embed = buildModulosEmbed(cfg, guild.name);
        const rows = buildModulosRows(cfg);
        return i.editReply({ embeds: [embed], components: rows });
    }
    if (action === 'toggle_feat') {
        if (!(await (0, permissions_1.checkAdmin)(i)))
            return;
        await i.deferUpdate();
        const feat = i.customId.split(':')[2];
        if (!feat || !features_1.FEATURE_KEYS.includes(feat))
            return;
        const cfg = await (0, helpers_1.getConfig)(guild.id);
        const current = cfg[feat] ?? true;
        await client_1.prisma.guildConfig.update({
            where: { guildId: guild.id },
            data: { [feat]: !current },
        });
        const updated = await (0, helpers_1.getConfig)(guild.id);
        const embed = buildModulosEmbed(updated, guild.name);
        const rows = buildModulosRows(updated);
        return i.editReply({ embeds: [embed], components: rows });
    }
    if (action === 'mod') {
        if (!(await (0, permissions_1.checkAdmin)(i)))
            return;
        await i.deferReply({ ephemeral: true });
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
            .setTitle('🔨 Moderação Rápida')
            .setDescription('Use os comandos de moderação ou o painel `/mod` para ações rápidas.');
        return i.editReply({ embeds: [embed] });
    }
    if (action === 'allowlist') {
        await i.deferReply({ ephemeral: true });
        return showAllowlistPanel(i, false);
    }
    if (action === 'stats') {
        await i.deferReply({ ephemeral: true });
        const [totalMembers, totalWins, totalTickets, totalAchievements, topMember] = await Promise.all([
            client_1.prisma.member.count(),
            client_1.prisma.giveaway.count({ where: { guildId: guild.id } }),
            client_1.prisma.ticket.count(),
            client_1.prisma.achievement.count(),
            client_1.prisma.member.findFirst({ orderBy: [{ level: 'desc' }, { xp: 'desc' }] }),
        ]);
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD)
            .setTitle(`📈 Estatísticas — ${guild.name}`)
            .addFields({ name: '👥 Membros cadastrados', value: `**${totalMembers}**`, inline: true }, { name: '🎁 Sorteios realizados', value: `**${totalWins}**`, inline: true }, { name: '🎫 Tickets abertos', value: `**${totalTickets}**`, inline: true }, { name: '🏅 Conquistas concedidas', value: `**${totalAchievements}**`, inline: true }, { name: '🏆 Membro #1', value: topMember ? `**${topMember.username}** (Nv ${topMember.level})` : 'N/A', inline: true });
        return i.editReply({ embeds: [embed] });
    }
    if (action === 'anuncio') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:anuncio').setTitle('Criar Anúncio');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('titulo').setLabel('Título').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(100)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('mensagem').setLabel('Mensagem').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true).setMaxLength(2000)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('canal').setLabel('ID do canal (vazio = canal atual)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)));
        return i.showModal(modal);
    }
    if (action === 'poll') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:poll').setTitle('Criar Enquete');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('pergunta').setLabel('Pergunta').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(200)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('opcoes').setLabel('Opções (uma por linha, máx 4)').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true).setMaxLength(400)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('duracao').setLabel('Duração (ex: 1h, 30m, 1d)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)));
        return i.showModal(modal);
    }
    if (action === 'sorteio') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:sorteio').setTitle('Criar Sorteio');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('premio').setLabel('Prêmio').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(100)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('vencedores').setLabel('Quantidade de vencedores').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('1').setMaxLength(2)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('duracao').setLabel('Duração (ex: 1h, 30m, 1d)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)));
        return i.showModal(modal);
    }
    if (action === 'encerrar_sorteio') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:encerrar_sorteio').setTitle('Encerrar Sorteio');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('id').setLabel('ID do sorteio').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)));
        return i.showModal(modal);
    }
    if (action === 'evento') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:evento').setTitle('Criar Evento');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('titulo').setLabel('Título do evento').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(100)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('descricao').setLabel('Descrição').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(false).setMaxLength(500)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('inicio').setLabel('Início (ex: 2h, 1d, 30m a partir de agora)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)));
        return i.showModal(modal);
    }
    if (action === 'conquista') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:conquista').setTitle('Gerenciar Conquistas');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('acao').setLabel('Ação: "criar" ou "dar"').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('nome').setLabel('Nome da conquista').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(60)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('descricao').setLabel('Descrição (ao criar) ou ID do usuário (ao dar)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('recompensa').setLabel('XP,Moedas de recompensa (ao criar, ex: 100,50)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)));
        return i.showModal(modal);
    }
    if (action === 'nivel_reward') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:nivel_reward').setTitle('Recompensa por Nível');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('nivel').setLabel('Nível').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('cargo').setLabel('ID do cargo (ou vazio para remover)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('moedas').setLabel('Moedas de recompensa (padrão 0)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)));
        return i.showModal(modal);
    }
    if (action === 'economia') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:admin_economia').setTitle('Gerenciar Economia');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('acao').setLabel('Ação: "dar" ou "remover"').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('tipo').setLabel('Tipo: "moedas" ou "xp"').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('usuario').setLabel('ID ou @menção do usuário').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('quantidade').setLabel('Quantidade').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)));
        return i.showModal(modal);
    }
    if (action === 'loja') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:admin_loja').setTitle('Gerenciar Loja');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('acao').setLabel('Ação: "criar" ou "remover"').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('nome').setLabel('Nome do item').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(50)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('preco').setLabel('Preço em moedas (ao criar)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('descricao').setLabel('Descrição (ao criar)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setMaxLength(150)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('cargo').setLabel('ID do cargo concedido (ao criar, opcional)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)));
        return i.showModal(modal);
    }
    if (action === 'rank') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:rank').setTitle('Definir Rank');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('usuario').setLabel('ID ou @menção do usuário').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('rank').setLabel(`Rank: ${types_1.RANKS.join(', ')}`).setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)));
        return i.showModal(modal);
    }
    // ── Registro de Cargos ────────────────────────────────────────────────
    if (action === 'cargo_menu') {
        const menus = await client_1.prisma.selfRoleMenu.findMany({
            where: { guildId: guild.id },
            include: { entries: true },
            orderBy: { createdAt: 'desc' },
        });
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
            .setTitle('🎭 Registro de Cargos')
            .setDescription('Crie menus onde membros escolhem seus próprios cargos com um clique.\n\n' +
            (menus.length
                ? menus.map(m => `**${m.title}** — <#${m.channelId}> — ${m.entries.length} cargo(s)${m.messageId ? ' ✅' : ' ⏳'}`).join('\n')
                : '*Nenhum menu criado ainda.*'));
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('admin:cargo_criar').setLabel('Criar Menu').setEmoji('🆕').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('admin:cargo_adicionar').setLabel('Adicionar Cargo').setEmoji('➕').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('admin:cargo_publicar').setLabel('Publicar').setEmoji('📤').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('admin:cargo_remover').setLabel('Remover Cargo').setEmoji('🗑️').setStyle(discord_js_1.ButtonStyle.Danger));
        return i.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
    if (action === 'cargo_criar') {
        // Passo 1: escolher o canal via ChannelSelectMenu
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
            .setTitle('🎭 Criar Menu de Cargos — Passo 1/2')
            .setDescription('Selecione o **canal** onde o menu de cargos será publicado.');
        const chanSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ChannelSelectMenuBuilder()
            .setCustomId('selfrole_admin:channel_for_criar')
            .setPlaceholder('📢 Selecione o canal de destino...'));
        return i.reply({ embeds: [embed], components: [chanSelect], ephemeral: true });
    }
    if (action === 'cargo_adicionar') {
        const menus = await client_1.prisma.selfRoleMenu.findMany({ where: { guildId: guild.id }, include: { entries: true }, orderBy: { createdAt: 'desc' } });
        if (!menus.length) {
            return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Menus', 'Crie um menu primeiro clicando em **🆕 Criar Menu**.')], ephemeral: true });
        }
        // Se só há um menu, vai direto para seleção de cargo
        if (menus.length === 1) {
            const m = menus[0];
            if (m.entries.length >= 25) {
                return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Limite', 'Este menu já tem 25 cargos (máximo).')], ephemeral: true });
            }
            const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
                .setTitle(`➕ Adicionar Cargo — ${m.title}`)
                .setDescription(`Selecione o **cargo** que deseja adicionar ao menu.\n> Atualmente: **${m.entries.length}** cargo(s)`);
            const roleSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.RoleSelectMenuBuilder()
                .setCustomId(`selfrole_admin:add_role:${m.id}`)
                .setPlaceholder('🎭 Selecione o cargo a adicionar...'));
            return i.reply({ embeds: [embed], components: [roleSelect], ephemeral: true });
        }
        // Múltiplos menus: escolher qual primeiro
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
            .setTitle('➕ Adicionar Cargo — Escolha o Menu')
            .setDescription('Você tem vários menus. Selecione em qual deseja adicionar o cargo:');
        const menuSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('selfrole_admin:menu_for_add')
            .setPlaceholder('📋 Selecione o menu...')
            .addOptions(menus.map(m => new discord_js_1.StringSelectMenuOptionBuilder()
            .setValue(m.id)
            .setLabel(m.title.slice(0, 100))
            .setDescription(`${m.entries.length} cargo(s) • <#${m.channelId}>`.slice(0, 100))
            .setEmoji('🎭'))));
        return i.reply({ embeds: [embed], components: [menuSelect], ephemeral: true });
    }
    if (action === 'cargo_publicar') {
        const menus = await client_1.prisma.selfRoleMenu.findMany({ where: { guildId: guild.id }, include: { entries: true }, orderBy: { createdAt: 'desc' } });
        if (!menus.length) {
            return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Menus', 'Crie um menu primeiro.')], ephemeral: true });
        }
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
            .setTitle('📤 Publicar Menu de Cargos')
            .setDescription('Selecione qual menu deseja publicar (ou atualizar):');
        const menuSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('selfrole_admin:menu_for_pub')
            .setPlaceholder('📋 Selecione o menu...')
            .addOptions(menus.map(m => new discord_js_1.StringSelectMenuOptionBuilder()
            .setValue(m.id)
            .setLabel(m.title.slice(0, 100))
            .setDescription(`${m.entries.length} cargo(s) • ${m.messageId ? '✅ Publicado' : '⏳ Não publicado'}`.slice(0, 100))
            .setEmoji(m.messageId ? '✅' : '📤'))));
        return i.reply({ embeds: [embed], components: [menuSelect], ephemeral: true });
    }
    if (action === 'cargo_remover') {
        const menus = await client_1.prisma.selfRoleMenu.findMany({ where: { guildId: guild.id }, include: { entries: true }, orderBy: { createdAt: 'desc' } });
        if (!menus.length) {
            return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Menus', 'Nenhum menu existente.')], ephemeral: true });
        }
        // Se só há um menu, vai direto para seleção de entrada
        if (menus.length === 1) {
            const m = menus[0];
            if (!m.entries.length) {
                return i.reply({ embeds: [(0, embeds_1.errorEmbed)('Menu Vazio', 'Este menu não tem cargos para remover.')], ephemeral: true });
            }
            const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
                .setTitle(`🗑️ Remover Cargo — ${m.title}`)
                .setDescription('Selecione o cargo que deseja remover:');
            const entrySelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
                .setCustomId(`selfrole_admin:rem_entry:${m.id}`)
                .setPlaceholder('🗑️ Selecione o cargo a remover...')
                .addOptions(m.entries.map(e => new discord_js_1.StringSelectMenuOptionBuilder()
                .setValue(e.id)
                .setLabel(e.label.slice(0, 100))
                .setDescription(`ID: ${e.roleId}`)
                .setEmoji(e.emoji && /^\d{17,20}$/.test(e.emoji) ? { id: e.emoji } : e.emoji ? { name: e.emoji } : { name: '🏷️' }))));
            return i.reply({ embeds: [embed], components: [entrySelect], ephemeral: true });
        }
        // Múltiplos menus: escolher qual primeiro
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
            .setTitle('🗑️ Remover Cargo — Escolha o Menu')
            .setDescription('Selecione de qual menu deseja remover um cargo:');
        const menuSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('selfrole_admin:menu_for_rem')
            .setPlaceholder('📋 Selecione o menu...')
            .addOptions(menus.map(m => new discord_js_1.StringSelectMenuOptionBuilder()
            .setValue(m.id)
            .setLabel(m.title.slice(0, 100))
            .setDescription(`${m.entries.length} cargo(s)`.slice(0, 100))
            .setEmoji('🎭'))));
        return i.reply({ embeds: [embed], components: [menuSelect], ephemeral: true });
    }
}
// ─── MOD BUTTONS ─────────────────────────────────────────────────────────────
async function modButtons(i, action) {
    if (!(await (0, permissions_1.checkModerator)(i)))
        return;
    const modals = {
        ban: { title: '🔨 Banir Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }, { id: 'motivo', label: 'Motivo' }, { id: 'dias', label: 'Dias de mensagens a deletar (0-7)', placeholder: '0' }] },
        kick: { title: '👟 Expulsar Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }, { id: 'motivo', label: 'Motivo' }] },
        mute: { title: '🔇 Mutar Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }, { id: 'duracao', label: 'Duração (ex: 10m, 1h, 1d)' }, { id: 'motivo', label: 'Motivo' }] },
        unmute: { title: '🔊 Desmutar Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }] },
        warn: { title: '⚠️ Advertir Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }, { id: 'motivo', label: 'Motivo' }] },
        warns: { title: '📋 Ver Avisos', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }] },
        limpar: { title: '🗑️ Limpar Mensagens', fields: [{ id: 'quantidade', label: 'Quantidade (1-100)', placeholder: '10' }] },
        unban: { title: '🚫 Desbanir Usuário', fields: [{ id: 'usuario', label: 'ID do usuário' }, { id: 'motivo', label: 'Motivo (opcional)' }] },
        remover_warn: { title: '🔄 Remover Aviso', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }] },
        slowmode: { title: '🐢 Slowmode', fields: [{ id: 'segundos', label: 'Segundos (0 para desativar)' }] },
        lock: { title: '🔒 Trancar Canal', fields: [{ id: 'motivo', label: 'Motivo (opcional)' }] },
        unlock: { title: '🔓 Destrancar Canal', fields: [{ id: 'motivo', label: 'Motivo (opcional)' }] },
    };
    const cfg = modals[action];
    if (!cfg)
        return;
    const modal = new discord_js_1.ModalBuilder().setCustomId(`mod_modal:${action}`).setTitle(cfg.title);
    modal.addComponents(...cfg.fields.map(f => new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
        .setCustomId(f.id)
        .setLabel(f.label)
        .setStyle(f.long ? discord_js_1.TextInputStyle.Paragraph : discord_js_1.TextInputStyle.Short)
        .setRequired(f.id !== 'motivo' || action === 'warn' || action === 'ban' || action === 'kick')
        .setPlaceholder(f.placeholder ?? ''))));
    return i.showModal(modal);
}
// ─── CONFIG BUTTONS ───────────────────────────────────────────────────────────
async function configButtons(i, action, extra) {
    if (!(await (0, permissions_1.checkAdmin)(i)))
        return;
    if (action === 'channels') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:config:channels').setTitle('Configurar Canais');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('log').setLabel('ID — Canal de Logs').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('welcome').setLabel('ID — Canal de Boas-vindas').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('levelup').setLabel('ID — Canal de Level-up').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('suggestion').setLabel('ID — Canal de Sugestões').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('ticket_log').setLabel('ID — Canal de Log de Tickets').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)));
        return i.showModal(modal);
    }
    if (action === 'roles') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:config:roles').setTitle('Configurar Cargos');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('admin').setLabel('ID — Cargo de Admin').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('mod').setLabel('ID — Cargo de Moderador').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('member').setLabel('ID — Cargo de Membro (auto ao entrar)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('auto').setLabel('ID — Cargo automático ao entrar').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false)));
        return i.showModal(modal);
    }
    if (action === 'xp') {
        const config = await (0, helpers_1.getConfig)(i.guild.id);
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:config:xp').setTitle('Configurar XP & Proteções');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('xp_min').setLabel('XP mínimo por mensagem').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.xpMin))), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('xp_max').setLabel('XP máximo por mensagem').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.xpMax))), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('cooldown').setLabel('Cooldown em segundos').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.xpCooldown))), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('antispam').setLabel('Anti-spam (true/false)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.antiSpam))), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('antilinks').setLabel('Anti-links (true/false)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.antiLinks))));
        return i.showModal(modal);
    }
    if (action === 'welcome') {
        const config = await (0, helpers_1.getConfig)(i.guild.id);
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:config:welcome').setTitle('Mensagem de Boas-vindas');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('mensagem').setLabel('Mensagem ({user} = menção, {server} = servidor)').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(false).setPlaceholder(config.welcomeMessage ?? 'Bem-vindo(a) {user} à {server}!').setMaxLength(500)));
        return i.showModal(modal);
    }
}
// ─── TICKET BUTTONS ───────────────────────────────────────────────────────────
async function ticketButtons(i, action, extra) {
    if (action === 'open') {
        await i.deferReply({ ephemeral: true });
        const config = await (0, helpers_1.getConfig)(i.guild.id);
        const embed = (0, embeds_1.baseEmbed)().setTitle(`${embeds_1.EMOJIS.TICKET} Abrir Ticket`).setDescription('Selecione a categoria do seu ticket:');
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder().setCustomId('ticket:category').setPlaceholder('Selecione uma categoria').addOptions(new discord_js_1.StringSelectMenuOptionBuilder().setLabel('Suporte Geral').setValue('suporte').setEmoji('🛠️'), new discord_js_1.StringSelectMenuOptionBuilder().setLabel('Parceria').setValue('parceria').setEmoji('🤝'), new discord_js_1.StringSelectMenuOptionBuilder().setLabel('Reporte').setValue('reporte').setEmoji('🚨'), new discord_js_1.StringSelectMenuOptionBuilder().setLabel('Candidatura').setValue('candidatura').setEmoji('📋'), new discord_js_1.StringSelectMenuOptionBuilder().setLabel('Outro').setValue('outro').setEmoji('❓')));
        return i.editReply({ embeds: [embed], components: [row] });
    }
    if (action === 'close') {
        const [ticketId] = extra;
        if (!(await (0, permissions_1.checkModerator)(i)))
            return;
        await i.deferReply({ ephemeral: true });
        const ticket = await client_1.prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket)
            return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Ticket não encontrado.')] });
        await client_1.prisma.ticket.update({ where: { id: ticketId }, data: { status: 'closed', closedAt: new Date() } });
        const config = await (0, helpers_1.getConfig)(i.guild.id);
        if (config.ticketLogChannelId) {
            const ch = i.guild?.channels.cache.get(config.ticketLogChannelId);
            if (ch)
                await ch.send({ embeds: [(0, embeds_1.baseEmbed)(embeds_1.COLORS.ERROR).setTitle('🎫 Ticket Fechado').addFields({ name: 'Fechado por', value: `${i.user.tag}`, inline: true }, { name: 'Canal', value: `${ticket.channelId}`, inline: true })] });
        }
        await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Ticket Fechado', 'Este canal será deletado em 5 segundos.')] });
        setTimeout(async () => {
            const ch = i.guild?.channels.cache.get(ticket.channelId);
            if (ch)
                await ch.delete().catch(() => null);
        }, 5000);
    }
    if (action === 'claim') {
        const [ticketId] = extra;
        if (!(await (0, permissions_1.checkModerator)(i)))
            return;
        await i.deferReply({ ephemeral: true });
        await client_1.prisma.ticket.update({ where: { id: ticketId }, data: { claimedBy: i.user.id } });
        await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Ticket Assumido', `Você assumiu este ticket.`)] });
        const ch = i.channel;
        if (ch)
            await ch.send({ embeds: [(0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO).setDescription(`${embeds_1.EMOJIS.SHIELD} Ticket assumido por ${i.user}.`)] });
    }
}
// ─── POLL VOTE ────────────────────────────────────────────────────────────────
async function pollVote(i, extra) {
    const [pollId, optionId] = extra;
    await i.deferReply({ ephemeral: true });
    const option = await client_1.prisma.pollOption.findUnique({ where: { id: optionId } });
    if (!option)
        return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Opção não encontrada.')] });
    const poll = await client_1.prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll || poll.ended)
        return i.editReply({ embeds: [(0, embeds_1.warningEmbed)('Encerrada', 'Esta enquete já foi encerrada.')] });
    if (option.voters.includes(i.user.id))
        return i.editReply({ embeds: [(0, embeds_1.warningEmbed)('Já votou', 'Você já votou nesta opção.')] });
    const allOptions = await client_1.prisma.pollOption.findMany({ where: { pollId } });
    const alreadyVoted = allOptions.some(o => o.voters.includes(i.user.id));
    if (alreadyVoted) {
        await client_1.prisma.pollOption.updateMany({ where: { pollId, voters: { has: i.user.id } }, data: { votes: { decrement: 1 } } });
        for (const o of allOptions) {
            if (o.voters.includes(i.user.id)) {
                await client_1.prisma.pollOption.update({ where: { id: o.id }, data: { voters: o.voters.filter(v => v !== i.user.id) } });
            }
        }
    }
    await client_1.prisma.pollOption.update({ where: { id: optionId }, data: { votes: { increment: 1 }, voters: { push: i.user.id } } });
    await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Voto Registrado!', `Você votou em **${option.label}**.`)] });
}
// ─── GIVEAWAY JOIN ────────────────────────────────────────────────────────────
async function giveawayJoin(i, extra) {
    const [giveawayId] = extra;
    await i.deferReply({ ephemeral: true });
    const giveaway = await client_1.prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway || giveaway.ended)
        return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Encerrado', 'Este sorteio já foi encerrado.')] });
    const member = await client_1.prisma.member.upsert({ where: { discordId: i.user.id }, update: {}, create: { discordId: i.user.id, username: i.user.username } });
    const exists = await client_1.prisma.giveawayEntry.findUnique({ where: { giveawayId_memberId: { giveawayId, memberId: member.id } } });
    if (exists)
        return i.editReply({ embeds: [(0, embeds_1.warningEmbed)('Já Participando', 'Você já está participando deste sorteio!')] });
    await client_1.prisma.giveawayEntry.create({ data: { giveawayId, memberId: member.id } });
    const count = await client_1.prisma.giveawayEntry.count({ where: { giveawayId } });
    try {
        const ch = i.guild?.channels.cache.get(giveaway.channelId);
        if (ch && giveaway.messageId) {
            const msg = await ch.messages.fetch(giveaway.messageId);
            if (msg.embeds[0])
                await msg.edit({ embeds: [discord_js_1.EmbedBuilder.from(msg.embeds[0]).setFooter({ text: `${count} participante${count !== 1 ? 's' : ''} • ⚔️ Aliança Skyline` })] });
        }
    }
    catch { /* ignore */ }
    await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Inscrito!', `Você entrou no sorteio de **${giveaway.prize}**! 🎉`)] });
}
// ─── EVENT JOIN ───────────────────────────────────────────────────────────────
async function eventJoin(i, extra) {
    const [eventId] = extra;
    await i.deferReply({ ephemeral: true });
    const event = await client_1.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.ended)
        return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Encerrado', 'Este evento já foi encerrado.')] });
    const member = await client_1.prisma.member.upsert({ where: { discordId: i.user.id }, update: {}, create: { discordId: i.user.id, username: i.user.username } });
    const exists = await client_1.prisma.eventParticipant.findUnique({ where: { eventId_memberId: { eventId, memberId: member.id } } });
    if (exists)
        return i.editReply({ embeds: [(0, embeds_1.warningEmbed)('Já Inscrito', 'Você já está inscrito neste evento!')] });
    await client_1.prisma.eventParticipant.create({ data: { eventId, memberId: member.id } });
    const count = await client_1.prisma.eventParticipant.count({ where: { eventId } });
    await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Inscrito!', `Você está inscrito no evento **${event.title}**! 👥 ${count} inscritos.`)] });
}
// ─── LOJA ─────────────────────────────────────────────────────────────────────
async function lojaButtons(i, action, extra) {
    if (action === 'comprar') {
        const [itemId] = extra;
        await i.deferReply({ ephemeral: true });
        const item = await client_1.prisma.shopItem.findUnique({ where: { id: itemId } });
        if (!item || !item.active)
            return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Item não encontrado.')] });
        if (item.stock === 0)
            return i.editReply({ embeds: [(0, embeds_1.warningEmbed)('Esgotado', 'Este item está sem estoque.')] });
        const member = await (0, helpers_1.getOrCreateMember)(i.user.id, i.user.username);
        if (member.coins < item.price)
            return i.editReply({ embeds: [(0, embeds_1.warningEmbed)('Saldo insuficiente', `Você tem **${member.coins}** moedas. Este item custa **${item.price}**.`)] });
        const guildMember = i.member;
        if (item.roleId && guildMember.roles.cache.has(item.roleId))
            return i.editReply({ embeds: [(0, embeds_1.warningEmbed)('Já possui', 'Você já tem o cargo deste item.')] });
        await client_1.prisma.$transaction(async (tx) => {
            await tx.member.update({ where: { discordId: i.user.id }, data: { coins: { decrement: item.price } } });
            await tx.shopPurchase.create({ data: { itemId: item.id, memberId: i.user.id, guildId: i.guild.id } });
            if (item.stock > 0)
                await tx.shopItem.update({ where: { id: item.id }, data: { stock: { decrement: 1 } } });
        });
        if (item.roleId) {
            try {
                await guildMember.roles.add(item.roleId);
            }
            catch { /* ignore */ }
        }
        await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Compra Realizada!', `Você comprou **${item.name}**!\n${embeds_1.EMOJIS.COINS} Novo saldo: **${member.coins - item.price}** moedas${item.roleId ? `\n${embeds_1.EMOJIS.SHIELD} Cargo: <@&${item.roleId}>` : ''}`)] });
    }
}
// ─── MISSÕES ──────────────────────────────────────────────────────────────────
async function missoesButtons(i, action) {
    if (action === 'resgatar') {
        await i.deferReply({ ephemeral: true });
        const today = new Date().toISOString().slice(0, 10);
        await (0, missoes_1.ensureDailyMissions)(i.user.id, i.guild.id);
        const claimable = await client_1.prisma.dailyMission.findMany({ where: { memberId: i.user.id, guildId: i.guild.id, dateStr: today, completed: true, claimed: false } });
        if (!claimable.length)
            return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Nada para resgatar', 'Complete missões primeiro ou já resgatou tudo hoje.')] });
        const totalXp = claimable.reduce((a, m) => a + m.xpReward, 0);
        const totalCoins = claimable.reduce((a, m) => a + m.coinReward, 0);
        await client_1.prisma.$transaction([
            ...claimable.map(m => client_1.prisma.dailyMission.update({ where: { id: m.id }, data: { claimed: true } })),
            client_1.prisma.member.update({ where: { discordId: i.user.id }, data: { xp: { increment: totalXp }, coins: { increment: totalCoins } } }),
        ]);
        const lines = claimable.map(m => `✅ **${missionLabel(m.type)}** — ${embeds_1.EMOJIS.XP} +${m.xpReward} XP • ${embeds_1.EMOJIS.COINS} +${m.coinReward} moedas`).join('\n');
        await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Recompensas Resgatadas!', `${lines}\n\n**Total:** ${embeds_1.EMOJIS.XP} +${totalXp} XP • ${embeds_1.EMOJIS.COINS} +${totalCoins} moedas`)] });
    }
}
// ─── ECONOMIA ─────────────────────────────────────────────────────────────────
async function economiaButtons(i, action) {
    if (action === 'transferir') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:transferir').setTitle('Transferir Moedas');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('usuario').setLabel('ID ou @menção do destinatário').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('quantidade').setLabel('Quantidade de moedas').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)));
        return i.showModal(modal);
    }
}
// ─── ALLOWLIST ────────────────────────────────────────────────────────────────
async function allowlistButtons(i, action) {
    if (!(0, allowlist_1.isBotManager)(i.user.id)) {
        const e = (0, embeds_1.errorEmbed)('Acesso Negado', 'Apenas donos e managers do bot podem acessar este painel.');
        if (i.replied || i.deferred)
            return i.followUp({ embeds: [e], ephemeral: true });
        return i.reply({ embeds: [e], ephemeral: true });
    }
    if (action === 'panel') {
        await i.deferReply({ ephemeral: true });
        return showAllowlistPanel(i, false);
    }
    // Mostrar modal para adicionar / remover servidor
    if (action === 'add_guild') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:allowlist_add_guild').setTitle('Autorizar Servidor');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('guild_id').setLabel('ID do servidor').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678')), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('nota').setLabel('Nota (opcional)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setMaxLength(100)));
        return i.showModal(modal);
    }
    if (action === 'remove_guild') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:allowlist_remove_guild').setTitle('Revogar Servidor');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('guild_id').setLabel('ID do servidor').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678')));
        return i.showModal(modal);
    }
    if (action === 'add_manager') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:allowlist_add_manager').setTitle('Adicionar Manager');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('user_id').setLabel('ID do usuário Discord').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678')), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('username').setLabel('Nome (para referência)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(false).setMaxLength(50)));
        return i.showModal(modal);
    }
    if (action === 'remove_manager') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:allowlist_remove_manager').setTitle('Remover Manager');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('user_id').setLabel('ID do usuário a remover').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678')));
        return i.showModal(modal);
    }
}
async function showAllowlistPanel(i, update) {
    const guilds = await client_1.prisma.allowedGuild.findMany({ where: { active: true }, orderBy: { addedAt: 'asc' } });
    const managers = await client_1.prisma.botManager.findMany({ orderBy: { addedAt: 'asc' } });
    const active = (0, allowlist_1.isEnforcementActive)();
    const count = (0, allowlist_1.allowedGuildCount)();
    const botIn = i.client.guilds.cache.size;
    const guildLines = guilds.length
        ? guilds.map(g => {
            const live = i.client.guilds.cache.get(g.guildId);
            return `${live ? '🟢' : '⚫'} **${g.guildName ?? g.guildId}** \`${g.guildId}\`` + (g.note ? ` — ${g.note}` : '');
        }).join('\n')
        : '*Nenhum servidor autorizado — modo bootstrap ativo (todos podem usar o bot)*';
    const ownerIds = (0, allowlist_1.getOwnerIds)();
    const ownerLines = ownerIds.map(id => `👑 <@${id}> — Dono (env)`).join('\n') || '*Nenhum OWNER_ID configurado*';
    const mgrLines = managers.length
        ? managers.map(m => `🔧 <@${m.userId}>${m.username ? ` — ${m.username}` : ''}`).join('\n')
        : '*Nenhum manager adicionado*';
    const embed = (0, embeds_1.baseEmbed)(active ? embeds_1.COLORS.SUCCESS : embeds_1.COLORS.WARNING)
        .setTitle('🌐 Gerenciamento de Acesso (Allowlist)')
        .addFields({ name: '📋 Modo atual', value: active ? `🔒 **Enforcement ativo** — apenas servidores da lista podem usar o bot` : '🔓 **Bootstrap** — qualquer servidor pode usar o bot', inline: false }, { name: `✅ Servidores autorizados (${guilds.length})`, value: guildLines.slice(0, 1000), inline: false }, { name: `👑 Donos`, value: ownerLines, inline: true }, { name: `🔧 Managers (${managers.length})`, value: mgrLines, inline: true }, { name: '🤖 Bot está em', value: `**${botIn}** servidor(es)`, inline: true })
        .setFooter({ text: '🟢 = bot está no servidor  ⚫ = bot não está lá' });
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('allowlist:add_guild').setLabel('+ Servidor').setEmoji('✅').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('allowlist:remove_guild').setLabel('− Servidor').setEmoji('🚫').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('allowlist:add_manager').setLabel('+ Manager').setEmoji('🔧').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('allowlist:remove_manager').setLabel('− Manager').setEmoji('👤').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('refresh:allowlist').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
    const payload = { embeds: [embed], components: [row] };
    return update ? i.update(payload) : i.editReply(payload);
}
// ─── REFRESH BUTTONS (atualizam in-place com i.update) ───────────────────────
async function refreshButtons(i, action) {
    const guild = i.guild;
    if (action === 'ranking' || action === 'ranking_coins') {
        const byCoins = action === 'ranking_coins';
        const top = byCoins
            ? await client_1.prisma.member.findMany({ orderBy: { coins: 'desc' }, take: 10 })
            : await client_1.prisma.member.findMany({ orderBy: [{ level: 'desc' }, { xp: 'desc' }], take: 10 });
        const medals = ['🥇', '🥈', '🥉'];
        const list = byCoins
            ? top.map((m, idx) => `${medals[idx] ?? `**${idx + 1}.**`} **${m.username}** — ${embeds_1.EMOJIS.COINS} ${m.coins.toLocaleString('pt-BR')} moedas`).join('\n')
            : top.map((m, idx) => `${medals[idx] ?? `**${idx + 1}.**`} ${(0, embeds_1.rankEmoji)(m.rank)} **${m.username}** — Nv ${m.level} • ${m.xp} XP`).join('\n');
        const title = byCoins ? `${embeds_1.EMOJIS.TROPHY} Top 10 — Mais Ricos` : `${embeds_1.EMOJIS.TROPHY} Top 10 — Ranking`;
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD).setTitle(title).setDescription(list || 'Nenhum membro.');
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(byCoins ? 'refresh:ranking' : 'refresh:ranking_coins').setLabel(byCoins ? 'Por XP' : 'Mais Ricos').setEmoji(byCoins ? '💜' : '🪙').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId(`refresh:${action}`).setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.update({ embeds: [embed], components: [row] });
    }
    if (action === 'missoes') {
        await (0, missoes_1.ensureDailyMissions)(i.user.id, guild.id);
        const today = new Date().toISOString().slice(0, 10);
        const missions = await client_1.prisma.dailyMission.findMany({ where: { memberId: i.user.id, guildId: guild.id, dateStr: today } });
        const lines = missions.map(m => {
            const bar = buildBar(m.progress, m.target);
            const status = m.completed ? (m.claimed ? '✅ Resgatada' : '🎁 **Concluída!**') : `${m.progress}/${m.target}`;
            return `**${missionLabel(m.type)}**\n\`${bar}\` ${status}\n> ${embeds_1.EMOJIS.XP} +${m.xpReward} XP • ${embeds_1.EMOJIS.COINS} +${m.coinReward} moedas`;
        }).join('\n\n');
        const pending = missions.some(m => m.completed && !m.claimed);
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO)
            .setTitle(`${embeds_1.EMOJIS.FIRE} Missões Diárias — ${today}`)
            .setDescription(lines || 'Nenhuma missão disponível.')
            .setFooter({ text: '⚔️ Aliança Skyline • Renovam à meia-noite' });
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('missoes:resgatar').setLabel('Resgatar').setEmoji('🎁').setStyle(pending ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary).setDisabled(!pending), new discord_js_1.ButtonBuilder().setCustomId('refresh:missoes').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.update({ embeds: [embed], components: [row] });
    }
    if (action === 'servidor') {
        const today = new Date().toISOString().slice(0, 10);
        const [totalMembers, config, stat] = await Promise.all([
            client_1.prisma.member.count(),
            (0, helpers_1.getConfig)(guild.id),
            client_1.prisma.serverStat.findUnique({ where: { guildId_date: { guildId: guild.id, date: today } } }),
        ]);
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO)
            .setTitle(`${embeds_1.EMOJIS.CHART} ${guild.name}`)
            .setThumbnail(guild.iconURL() ?? null)
            .addFields({ name: '👥 Membros', value: `**${guild.memberCount}** (${bots} bots)`, inline: true }, { name: '📊 No banco', value: `**${totalMembers}**`, inline: true }, { name: '💬 Canais', value: `**${guild.channels.cache.size}**`, inline: true }, { name: '🎭 Cargos', value: `**${guild.roles.cache.size}**`, inline: true }, { name: '😀 Emojis', value: `**${guild.emojis.cache.size}**`, inline: true }, { name: '🚀 Boosts', value: `**${guild.premiumSubscriptionCount ?? 0}** (Tier ${guild.premiumTier})`, inline: true }, { name: '📅 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }, { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true }, { name: '📋 Log', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Não configurado', inline: true }, { name: '📈 Hoje — Entradas', value: `**${stat?.joins ?? 0}**`, inline: true }, { name: '📉 Hoje — Saídas', value: `**${stat?.leaves ?? 0}**`, inline: true }, { name: '🔨 Hoje — Bans', value: `**${stat?.bans ?? 0}**`, inline: true }, { name: '💬 Hoje — Mensagens', value: `**${(stat?.messages ?? 0).toLocaleString('pt-BR')}**`, inline: true });
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('painel:rede').setLabel('Rede Aliança').setEmoji('🌐').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('refresh:servidor').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.update({ embeds: [embed], components: [row] });
    }
    if (action === 'rede') {
        const today = new Date().toISOString().slice(0, 10);
        const guilds = i.client.guilds.cache;
        const guildIds = [...guilds.keys()];
        const stats = await client_1.prisma.serverStat.findMany({ where: { guildId: { in: guildIds }, date: today } });
        const statMap = new Map(stats.map(s => [s.guildId, s]));
        let totalHumans = 0, totalBots = 0, totalJoins = 0, totalLeaves = 0, totalBans = 0, totalMsgs = 0;
        const lines = [];
        for (const [id, g] of guilds) {
            const bots = g.members.cache.filter(m => m.user.bot).size;
            const humans = g.memberCount - bots;
            const s = statMap.get(id);
            totalHumans += humans;
            totalBots += bots;
            totalJoins += s?.joins ?? 0;
            totalLeaves += s?.leaves ?? 0;
            totalBans += s?.bans ?? 0;
            totalMsgs += s?.messages ?? 0;
            lines.push(`**${g.name}** — ${g.memberCount} membros${s ? ` • +${s.joins}/${s.leaves}/${s.bans}🔨` : ''}`);
        }
        const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.DARK)
            .setTitle(`🌐 Rede Aliança Skyline — ${guilds.size} servidor(es)`)
            .addFields({ name: '👥 Total membros', value: `**${(totalHumans + totalBots).toLocaleString('pt-BR')}** (${totalBots} bots)`, inline: true }, { name: '📈 Hoje — Entradas', value: `**${totalJoins}**`, inline: true }, { name: '📉 Hoje — Saídas', value: `**${totalLeaves}**`, inline: true }, { name: '🔨 Hoje — Bans', value: `**${totalBans}**`, inline: true }, { name: '💬 Hoje — Mensagens', value: `**${totalMsgs.toLocaleString('pt-BR')}**`, inline: true }, { name: `📋 Servidores (${guilds.size})`, value: lines.slice(0, 10).join('\n') || '—', inline: false })
            .setFooter({ text: '+entradas/saídas/bans hoje • ⚔️ Aliança Skyline' });
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('refresh:rede').setLabel('Atualizar').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
        return i.update({ embeds: [embed], components: [row] });
    }
    if (action === 'allowlist') {
        return showAllowlistPanel(i, true);
    }
}
// ─── HELPERS ──────────────────────────────────────────────────────────────────
function buildBar(progress, target, length = 10) {
    const filled = Math.min(length, Math.round((Math.min(progress, target) / target) * length));
    return '█'.repeat(filled) + '░'.repeat(length - filled);
}
function missionLabel(type) {
    const map = {
        enviar_mensagens: '💬 Enviar mensagens',
        ganhar_xp: '💜 Ganhar XP',
        estar_online: '🟢 Login diário',
    };
    return map[type] ?? type;
}
// ── /rpgwipe confirmation buttons ────────────────────────────────────────────
async function rpgwipeButtons(interaction, action) {
    const { isOwner } = await Promise.resolve().then(() => __importStar(require('../utils/permissions')));
    if (!isOwner(interaction.user.id)) {
        return interaction.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas o dono do bot pode confirmar o wipe.')], ephemeral: true });
    }
    if (action === 'cancel') {
        return interaction.update({
            embeds: [new discord_js_1.EmbedBuilder().setColor(embeds_1.COLORS.SUCCESS).setTitle('✅ Wipe Cancelado').setDescription('Nenhum dado foi apagado.')],
            components: [],
        });
    }
    if (action === 'confirm') {
        await interaction.update({
            embeds: [new discord_js_1.EmbedBuilder().setColor(embeds_1.COLORS.DARK).setTitle('⏳ Wipando...').setDescription('Apagando todos os dados de RPG. Aguarde...')],
            components: [],
        });
        // Deletar na ordem correta para respeitar FK
        const [chars, guilds] = await client_1.prisma.$transaction([
            client_1.prisma.rpgCombatLog.deleteMany(),
            client_1.prisma.rpgShopRotation.deleteMany(),
            client_1.prisma.rpgCraftQueue.deleteMany(),
            client_1.prisma.rpgLearnedSkill.deleteMany(),
            client_1.prisma.rpgGuildMember.deleteMany(),
            client_1.prisma.rpgInventoryItem.deleteMany(),
            client_1.prisma.rpgEquipment.deleteMany(),
            client_1.prisma.rpgCharacter.deleteMany(),
            client_1.prisma.rpgGuild.deleteMany(),
        ]).then(results => [results[7].count, results[8].count]); // char + guild counts
        return interaction.editReply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(0xE74C3C)
                    .setTitle('☢️ RPG Wipado com Sucesso')
                    .setDescription(`Todos os dados de RPG foram apagados.\n\n` +
                    `> 🧑 **${chars}** personagem(ns) deletado(s)\n` +
                    `> 🏛️ **${guilds}** guilda(s) deletada(s)\n` +
                    `> Inventários, equipamentos, habilidades, logs e crafts também removidos.`)
                    .setFooter({ text: `Executado por ${interaction.user.username}` })
                    .setTimestamp(),
            ],
        });
    }
}
// ── Selfrole Admin — publicar confirmação ───────────────────────────────────
async function selfRoleAdminButtons(i, action, extra) {
    if (!(await (0, permissions_1.checkAdmin)(i)))
        return;
    await i.deferUpdate();
    if (action === 'confirm_pub') {
        const menuId = extra[0];
        const menu = await client_1.prisma.selfRoleMenu.findUnique({
            where: { id: menuId },
            include: { entries: true },
        });
        if (!menu)
            return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Menu não encontrado', 'Este menu não existe mais.')], components: [] });
        if (!menu.entries.length)
            return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Menu Vazio', 'Adicione pelo menos um cargo antes de publicar.')], components: [] });
        const targetChannel = i.guild?.channels.cache.get(menu.channelId);
        if (!targetChannel)
            return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Canal não encontrado', 'O canal do menu não existe mais.')], components: [] });
        const { buildMenuMessage } = await Promise.resolve().then(() => __importStar(require('../utils/selfRole')));
        const msgData = buildMenuMessage(menu);
        if (menu.messageId) {
            try {
                const msg = await targetChannel.messages.fetch(menu.messageId);
                await msg.edit(msgData);
                return i.editReply({ embeds: [(0, embeds_1.successEmbed)('✅ Menu Atualizado!', `Menu **${menu.title}** atualizado em ${targetChannel} com **${menu.entries.length}** cargo(s).`)], components: [] });
            }
            catch { /* mensagem deletada, enviar nova */ }
        }
        const msg = await targetChannel.send(msgData);
        await client_1.prisma.selfRoleMenu.update({ where: { id: menu.id }, data: { messageId: msg.id } });
        return i.editReply({ embeds: [(0, embeds_1.successEmbed)('✅ Menu Publicado!', `Menu **${menu.title}** publicado em ${targetChannel} com **${menu.entries.length}** cargo(s)!`)], components: [] });
    }
}
// ─── Módulos: build helpers ───────────────────────────────────────────────────
function buildModulosEmbed(cfg, guildName) {
    const lines = features_1.FEATURE_KEYS.map(k => {
        const m = features_1.FEATURE_META[k];
        const on = cfg[k] !== false;
        return (on ? '✅' : '❌') + ' ' + m.emoji + ' **' + m.label + '** — ' + m.desc;
    });
    return (0, embeds_1.baseEmbed)(embeds_1.COLORS.PRIMARY)
        .setTitle('🔧 Módulos — ' + guildName)
        .setDescription('Clique em um módulo para **habilitar** ou **desabilitar** neste servidor.\n\n' +
        lines.join('\n'))
        .setFooter({ text: 'Mudanças têm efeito imediato • ✅ = ativo • ❌ = inativo' });
}
function buildModulosRows(cfg) {
    const rows = [];
    let row = new discord_js_1.ActionRowBuilder();
    let count = 0;
    for (const k of features_1.FEATURE_KEYS) {
        if (count > 0 && count % 5 === 0) {
            rows.push(row);
            row = new discord_js_1.ActionRowBuilder();
        }
        const m = features_1.FEATURE_META[k];
        const on = cfg[k] !== false;
        row.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('admin:toggle_feat:' + k)
            .setLabel(m.label)
            .setEmoji(on ? '✅' : '❌')
            .setStyle(on ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Danger));
        count++;
    }
    if (count % 5 !== 0 || count === 0)
        rows.push(row);
    return rows;
}
// ── Selfrole — toggle de cargo por botão ────────────────────────────────────
async function selfRoleToggle(i, extra) {
    const [roleId] = extra;
    await i.deferReply({ ephemeral: true });
    const member = i.member;
    if (!member)
        return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'Não foi possível verificar seu perfil.')] });
    const role = i.guild?.roles.cache.get(roleId);
    if (!role)
        return i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Cargo Inválido', 'Este cargo não existe mais no servidor.')] });
    const hasRole = member.roles.cache.has(roleId);
    try {
        if (hasRole) {
            await member.roles.remove(roleId);
            return i.editReply({
                embeds: [new discord_js_1.EmbedBuilder().setColor(0xE74C3C)
                        .setDescription(`❌ O cargo ${role} foi **removido** do seu perfil.`)],
            });
        }
        else {
            await member.roles.add(roleId);
            return i.editReply({
                embeds: [new discord_js_1.EmbedBuilder().setColor(0x2ECC71)
                        .setDescription(`✅ O cargo ${role} foi **adicionado** ao seu perfil!`)],
            });
        }
    }
    catch {
        return i.editReply({
            embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Não foi possível alterar o cargo. Verifique se o bot tem permissão de gerenciar cargos.')],
        });
    }
}
//# sourceMappingURL=buttonHandler.js.map