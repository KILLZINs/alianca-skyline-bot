import {
  ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel,
  ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, GuildMember,
} from 'discord.js';
import { prisma } from '../database/client';
import { COLORS, EMOJIS, baseEmbed, successEmbed, errorEmbed, warningEmbed, rankEmoji, levelBar, colorFromLevel } from '../utils/embeds';
import { getOrCreateMember, getConfig, formatDuration } from '../utils/helpers';
import { xpForNextLevel, RANKS } from '../types';
import { checkAdmin, checkModerator } from '../utils/permissions';
import { ensureDailyMissions } from '../commands/utility/missoes';
import { isBotManager, isEnforcementActive, allowedGuildCount, getOwnerIds, cacheAddGuild, cacheRemoveGuild, cacheAddManager, cacheRemoveManager } from '../utils/allowlist';

export async function handleButton(interaction: ButtonInteraction) {
  const parts = interaction.customId.split(':');
  const prefix = parts[0];
  const action = parts[1];
  const extra = parts.slice(2);

  try {
    switch (prefix) {
      case 'painel':    return await painelButtons(interaction, action);
      case 'refresh':   return await refreshButtons(interaction, action);
      case 'admin':     return await adminButtons(interaction, action);
      case 'allowlist': return await allowlistButtons(interaction, action);
      case 'mod':      return await modButtons(interaction, action);
      case 'ticket':   return await ticketButtons(interaction, action, extra);
      case 'config':   return await configButtons(interaction, action, extra);
      case 'poll':     return await pollVote(interaction, extra);
      case 'giveaway': return await giveawayJoin(interaction, extra);
      case 'event':    return await eventJoin(interaction, extra);
      case 'loja':     return await lojaButtons(interaction, action, extra);
      case 'missoes':  return await missoesButtons(interaction, action);
      case 'economia': return await economiaButtons(interaction, action);
      case 'rpg':      return await (await import('./../rpg/handlers/rpgButtonHandler')).handleRpgButton(interaction, action);
      case 'rpgwipe':  return await rpgwipeButtons(interaction, action);
      case 'alianca':   return await (await import('./allianceHandler')).handleAliancaButton(interaction, action);
      case 'servidor':  return await (await import('./allianceHandler')).handleServidorButton(interaction, action);
      case 'embedcfg':  return await (await import('./configHandler')).handleEmbedCfgButton(interaction, action);
      case 'embeds':    return await (await import('./embedsHandler')).handleEmbedsButtonRaw(interaction);
    }
  } catch (err) {
    console.error('Button error:', err);
    const e = errorEmbed('Erro', 'Ocorreu um erro ao processar esta ação.');
    try {
      if (interaction.replied || interaction.deferred) await interaction.followUp({ embeds: [e], ephemeral: true });
      else await interaction.reply({ embeds: [e], ephemeral: true });
    } catch { /* ignore */ }
  }
}

// ─── PAINEL ──────────────────────────────────────────────────────────────────

async function painelButtons(i: ButtonInteraction, action: string) {
  const guild = i.guild!;

  if (action === 'perfil') {
    await i.deferReply({ ephemeral: true });
    const m = await getOrCreateMember(i.user.id, i.user.username);
    const xpNeeded = xpForNextLevel(m.level);
    const rankPos = await prisma.member.count({ where: { OR: [{ level: { gt: m.level } }, { level: m.level, xp: { gt: m.xp } }] } });
    const achievements = await prisma.achievement.count({ where: { memberId: m.discordId } });
    const totalWins = await prisma.giveaway.count({ where: { winnerIds: { has: m.discordId } } });
    const embed = baseEmbed(colorFromLevel(m.level))
      .setTitle(`${EMOJIS.PERSON} Perfil — ${i.user.username}`)
      .setThumbnail(i.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🏅 Rank', value: `${rankEmoji(m.rank)} **${m.rank}**`, inline: true },
        { name: '🎯 Nível', value: `**${m.level}**`, inline: true },
        { name: '📊 Posição', value: `**#${rankPos + 1}**`, inline: true },
        { name: '💜 XP', value: `${m.xp}/${xpNeeded}\n\`${levelBar(m.xp, xpNeeded)}\``, inline: false },
        { name: '🪙 Moedas', value: `**${m.coins.toLocaleString('pt-BR')}**`, inline: true },
        { name: '🏆 Conquistas', value: `**${achievements}**`, inline: true },
        { name: '⚠️ Avisos', value: `**${m.warnings}**`, inline: true },
        { name: '🎁 Sorteios Ganhos', value: `**${totalWins}**`, inline: true },
        { name: '📅 Membro desde', value: `<t:${Math.floor(m.createdAt.getTime() / 1000)}:D>`, inline: true },
      );
    return i.editReply({ embeds: [embed] });
  }

  if (action === 'nivel') {
    await i.deferReply({ ephemeral: true });
    const m = await getOrCreateMember(i.user.id, i.user.username);
    const xpNeeded = xpForNextLevel(m.level);
    const rankPos = await prisma.member.count({ where: { OR: [{ level: { gt: m.level } }, { level: m.level, xp: { gt: m.xp } }] } });
    const nextReward = await prisma.levelReward.findFirst({ where: { guildId: guild.id, level: { gt: m.level } }, orderBy: { level: 'asc' } });
    const embed = baseEmbed(colorFromLevel(m.level))
      .setTitle(`${EMOJIS.LEVEL} Nível — ${i.user.username}`)
      .setThumbnail(i.user.displayAvatarURL())
      .setDescription(
        `${rankEmoji(m.rank)} **${m.rank}**\n\n` +
        `**Nível ${m.level}** — ${m.xp}/${xpNeeded} XP\n\`${levelBar(m.xp, xpNeeded)}\`\n\n` +
        `📊 Posição global: **#${rankPos + 1}**`
      )
      .addFields(
        { name: '📈 XP Total acumulado', value: `**${m.xp + Array.from({ length: m.level - 1 }, (_, i) => xpForNextLevel(i + 1)).reduce((a, b) => a + b, 0)}** XP`, inline: true },
        { name: '🎯 Próxima recomp.', value: nextReward ? `Nível **${nextReward.level}** → <@&${nextReward.roleId}>` : 'Nenhuma configurada', inline: true },
      );
    return i.editReply({ embeds: [embed] });
  }

  if (action === 'ranking') {
    await i.deferReply({ ephemeral: true });
    const top = await prisma.member.findMany({ orderBy: [{ level: 'desc' }, { xp: 'desc' }], take: 10 });
    const medals = ['🥇', '🥈', '🥉'];
    const list = top.map((m, idx) =>
      `${medals[idx] ?? `**${idx + 1}.**`} ${rankEmoji(m.rank)} **${m.username}** — Nv ${m.level} • ${m.xp} XP`
    ).join('\n');
    const embed = baseEmbed(COLORS.GOLD).setTitle(`${EMOJIS.TROPHY} Top 10 — Ranking`).setDescription(list || 'Nenhum membro.');
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('refresh:ranking').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('refresh:ranking_coins').setLabel('Mais Ricos').setEmoji('🪙').setStyle(ButtonStyle.Primary),
    );
    return i.editReply({ embeds: [embed], components: [row] });
  }

  if (action === 'ranking_coins') {
    await i.deferReply({ ephemeral: true });
    const top = await prisma.member.findMany({ orderBy: { coins: 'desc' }, take: 10 });
    const medals = ['🥇', '🥈', '🥉'];
    const list = top.map((m, idx) =>
      `${medals[idx] ?? `**${idx + 1}.**`} **${m.username}** — ${EMOJIS.COINS} ${m.coins.toLocaleString('pt-BR')} moedas`
    ).join('\n');
    const embed = baseEmbed(COLORS.GOLD).setTitle(`${EMOJIS.TROPHY} Top 10 — Mais Ricos`).setDescription(list || 'Nenhum membro.');
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('refresh:ranking').setLabel('Por XP').setEmoji('💜').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('refresh:ranking_coins').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    );
    return i.editReply({ embeds: [embed], components: [row] });
  }

  if (action === 'conquistas') {
    await i.deferReply({ ephemeral: true });
    const list = await prisma.achievement.findMany({ where: { memberId: i.user.id }, orderBy: { earnedAt: 'desc' }, take: 15 });
    const desc = list.length
      ? list.map(a => `${EMOJIS.TROPHY} **${a.name}**${a.description ? ` — ${a.description}` : ''}\n> <t:${Math.floor(a.earnedAt.getTime() / 1000)}:D>`).join('\n\n')
      : 'Você ainda não tem conquistas. Complete missões e participe de eventos!';
    const embed = baseEmbed(COLORS.GOLD)
      .setTitle(`${EMOJIS.TROPHY} Conquistas — ${i.user.username}`)
      .setDescription(desc)
      .setFooter({ text: `${list.length} conquista(s) • ⚔️ Aliança Skyline` });
    return i.editReply({ embeds: [embed] });
  }

  if (action === 'economia') {
    await i.deferReply({ ephemeral: true });
    const m = await getOrCreateMember(i.user.id, i.user.username);
    const pos = await prisma.member.count({ where: { coins: { gt: m.coins } } });
    const embed = baseEmbed(COLORS.GOLD)
      .setTitle(`${EMOJIS.COINS} Economia — ${i.user.username}`)
      .addFields(
        { name: `${EMOJIS.COINS} Saldo`, value: `**${m.coins.toLocaleString('pt-BR')}** moedas`, inline: true },
        { name: '📊 Posição', value: `**#${pos + 1}** mais rico`, inline: true },
        { name: `${EMOJIS.LEVEL} Nível`, value: `**${m.level}**`, inline: true },
      )
      .setFooter({ text: '⚔️ Aliança Skyline' });
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('economia:transferir').setLabel('Transferir').setEmoji('💸').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel:ranking_coins').setLabel('Top Ricos').setEmoji('🏆').setStyle(ButtonStyle.Secondary),
    );
    return i.editReply({ embeds: [embed], components: [row] });
  }

  if (action === 'loja') {
    await i.deferReply({ ephemeral: true });
    const items = await prisma.shopItem.findMany({ where: { guildId: guild.id, active: true }, orderBy: { price: 'asc' } });
    if (!items.length) {
      return i.editReply({ embeds: [baseEmbed(COLORS.INFO).setTitle(`${EMOJIS.COINS} Loja`).setDescription('Nenhum item disponível no momento.')] });
    }
    const list = items.map(item => {
      const stock = item.stock === -1 ? '∞' : `${item.stock}`;
      return `${EMOJIS.COINS} **${item.name}** — **${item.price.toLocaleString('pt-BR')}** moedas (estoque: ${stock})\n> ${item.description}${item.roleId ? ` • <@&${item.roleId}>` : ''}`;
    }).join('\n\n');
    const embed = baseEmbed(COLORS.GOLD).setTitle(`${EMOJIS.COINS} Loja`).setDescription(list).setFooter({ text: `${items.length} item(ns) • ⚔️ Aliança Skyline` });
    const buyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...items.slice(0, 4).map(item =>
        new ButtonBuilder().setCustomId(`loja:comprar:${item.id}`).setLabel(item.name.slice(0, 20)).setEmoji('🛒').setStyle(ButtonStyle.Success)
      )
    );
    const components: ActionRowBuilder<ButtonBuilder>[] = [buyRow];
    return i.editReply({ embeds: [embed], components });
  }

  if (action === 'missoes') {
    await i.deferReply({ ephemeral: true });
    await ensureDailyMissions(i.user.id, guild.id);
    const today = new Date().toISOString().slice(0, 10);
    const missions = await prisma.dailyMission.findMany({ where: { memberId: i.user.id, guildId: guild.id, dateStr: today } });
    const lines = missions.map(m => {
      const bar = buildBar(m.progress, m.target);
      const status = m.completed ? (m.claimed ? '✅ Resgatada' : '🎁 **Concluída!**') : `${m.progress}/${m.target}`;
      return `**${missionLabel(m.type)}**\n\`${bar}\` ${status}\n> ${EMOJIS.XP} +${m.xpReward} XP • ${EMOJIS.COINS} +${m.coinReward} moedas`;
    }).join('\n\n');
    const pending = missions.some(m => m.completed && !m.claimed);
    const embed = baseEmbed(COLORS.INFO)
      .setTitle(`${EMOJIS.FIRE} Missões Diárias — ${today}`)
      .setDescription(lines || 'Nenhuma missão disponível.')
      .setFooter({ text: '⚔️ Aliança Skyline • Renovam à meia-noite' });
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('missoes:resgatar').setLabel('Resgatar').setEmoji('🎁').setStyle(pending ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(!pending),
      new ButtonBuilder().setCustomId('refresh:missoes').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    );
    return i.editReply({ embeds: [embed], components: [row] });
  }

  if (action === 'servidor') {
    await i.deferReply({ ephemeral: true });
    const g = guild;
    const today = new Date().toISOString().slice(0, 10);
    const [totalMembers, config, stat] = await Promise.all([
      prisma.member.count(),
      getConfig(g.id),
      prisma.serverStat.findUnique({ where: { guildId_date: { guildId: g.id, date: today } } }),
    ]);
    const bots = g.members.cache.filter(m => m.user.bot).size;
    const embed = baseEmbed(COLORS.INFO)
      .setTitle(`${EMOJIS.CHART} ${g.name}`)
      .setThumbnail(g.iconURL() ?? null)
      .addFields(
        { name: '👥 Membros', value: `**${g.memberCount}** (${bots} bots)`, inline: true },
        { name: '📊 No banco', value: `**${totalMembers}**`, inline: true },
        { name: '💬 Canais', value: `**${g.channels.cache.size}**`, inline: true },
        { name: '🎭 Cargos', value: `**${g.roles.cache.size}**`, inline: true },
        { name: '😀 Emojis', value: `**${g.emojis.cache.size}**`, inline: true },
        { name: '🚀 Boosts', value: `**${g.premiumSubscriptionCount ?? 0}** (Tier ${g.premiumTier})`, inline: true },
        { name: '📅 Criado em', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👑 Dono', value: `<@${g.ownerId}>`, inline: true },
        { name: '📋 Log', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Não configurado', inline: true },
        { name: `📈 Hoje — Entradas`, value: `**${stat?.joins ?? 0}**`, inline: true },
        { name: `📉 Hoje — Saídas`, value: `**${stat?.leaves ?? 0}**`, inline: true },
        { name: `🔨 Hoje — Bans`, value: `**${stat?.bans ?? 0}**`, inline: true },
        { name: `💬 Hoje — Mensagens`, value: `**${(stat?.messages ?? 0).toLocaleString('pt-BR')}**`, inline: true },
      );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('painel:rede').setLabel('Rede Aliança').setEmoji('🌐').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('refresh:servidor').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    );
    return i.editReply({ embeds: [embed], components: [row] });
  }

  if (action === 'rede') {
    await i.deferReply({ ephemeral: true });
    const today = new Date().toISOString().slice(0, 10);
    const guilds = i.client.guilds.cache;
    const guildIds = [...guilds.keys()];
    const stats = await prisma.serverStat.findMany({ where: { guildId: { in: guildIds }, date: today } });
    const statMap = new Map(stats.map(s => [s.guildId, s]));

    let totalHumans = 0, totalBots = 0, totalJoins = 0, totalLeaves = 0, totalBans = 0, totalMsgs = 0;
    const lines: string[] = [];

    for (const [id, g] of guilds) {
      const humans = g.memberCount - g.members.cache.filter(m => m.user.bot).size;
      const bots   = g.members.cache.filter(m => m.user.bot).size;
      const s = statMap.get(id);
      totalHumans += humans; totalBots += bots;
      totalJoins  += s?.joins ?? 0; totalLeaves += s?.leaves ?? 0;
      totalBans   += s?.bans  ?? 0; totalMsgs   += s?.messages ?? 0;
      lines.push(
        `**${g.name}** — ${g.memberCount} membros` +
        (s ? ` • +${s.joins}/${s.leaves}/${s.bans}🔨` : '')
      );
    }

    const embed = baseEmbed(COLORS.DARK)
      .setTitle(`🌐 Rede Aliança Skyline — ${guilds.size} servidor(es)`)
      .addFields(
        { name: '👥 Total de membros', value: `**${(totalHumans + totalBots).toLocaleString('pt-BR')}** (${totalBots} bots)`, inline: true },
        { name: '📈 Hoje — Entradas', value: `**${totalJoins}**`, inline: true },
        { name: '📉 Hoje — Saídas',   value: `**${totalLeaves}**`, inline: true },
        { name: '🔨 Hoje — Bans',     value: `**${totalBans}**`, inline: true },
        { name: '💬 Hoje — Mensagens', value: `**${totalMsgs.toLocaleString('pt-BR')}**`, inline: true },
        { name: `📋 Servidores (${guilds.size})`, value: lines.slice(0, 10).join('\n') || '—', inline: false },
      )
      .setFooter({ text: `+entradas/saídas/bans hoje • ⚔️ Aliança Skyline` });
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('refresh:rede').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    );
    return i.editReply({ embeds: [embed], components: [row] });
  }

  if (action === 'ticket') {
    await i.deferReply({ ephemeral: true });
    const embed = baseEmbed(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.TICKET} Suporte`)
      .setDescription('Selecione uma opção abaixo:');
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('ticket:open').setLabel('Abrir Ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel:sugestao').setLabel('Sugestão').setEmoji('💡').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel:feedback').setLabel('Feedback').setEmoji('📝').setStyle(ButtonStyle.Secondary),
    );
    return i.editReply({ embeds: [embed], components: [row] });
  }

  if (action === 'sugestao') {
    const modal = new ModalBuilder().setCustomId('modal:sugestaosubmit').setTitle('Enviar Sugestão');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('titulo').setLabel('Título da sugestão').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('descricao').setLabel('Descreva sua sugestão').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)),
    );
    return i.showModal(modal);
  }

  if (action === 'feedback') {
    const modal = new ModalBuilder().setCustomId('modal:feedbacksubmit').setTitle('Enviar Feedback');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('nota').setLabel('Nota (1-10)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(2)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('mensagem').setLabel('Seu feedback').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)),
    );
    return i.showModal(modal);
  }

  if (action === 'sorteios') {
    await i.deferReply({ ephemeral: true });
    const ativos = await prisma.giveaway.findMany({ where: { guildId: guild.id, ended: false }, orderBy: { endsAt: 'asc' }, take: 5 });
    const desc = ativos.length
      ? ativos.map(g => `🎁 **${g.prize}** — ${g.winners} vencedor(es)\n> Encerra <t:${Math.floor(g.endsAt.getTime() / 1000)}:R>`).join('\n\n')
      : 'Nenhum sorteio ativo no momento.';
    const embed = baseEmbed(COLORS.GOLD).setTitle(`${EMOJIS.GIFT} Sorteios Ativos`).setDescription(desc);
    return i.editReply({ embeds: [embed] });
  }

  if (action === 'eventos') {
    await i.deferReply({ ephemeral: true });
    const ativos = await prisma.event.findMany({ where: { guildId: guild.id, ended: false }, orderBy: { startsAt: 'asc' }, take: 5 });
    const desc = ativos.length
      ? ativos.map(e => {

          return `📌 **${e.title}**${e.description ? `\n> ${e.description}` : ''}\n> Começa <t:${Math.floor(e.startsAt.getTime() / 1000)}:R>`;
        }).join('\n\n')
      : 'Nenhum evento ativo no momento.';
    const embed = baseEmbed(COLORS.INFO).setTitle(`${EMOJIS.PIN} Eventos Ativos`).setDescription(desc);
    return i.editReply({ embeds: [embed] });
  }

  if (action === 'ping') {
    await i.deferReply({ ephemeral: true });
    const ws = i.client.ws.ping;
    const color = ws < 100 ? COLORS.SUCCESS : ws < 250 ? COLORS.WARNING : COLORS.ERROR;
    const quality = ws < 100 ? '🟢 Excelente' : ws < 250 ? '🟡 Boa' : '🔴 Alta';
    const embed = baseEmbed(color)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '💜 WebSocket', value: `**${ws}ms**`, inline: true },
        { name: '📊 Qualidade', value: quality, inline: true },
        { name: '🤖 Uptime', value: formatDuration(i.client.uptime ?? 0), inline: true },
        { name: '🖥️ Servidores', value: `**${i.client.guilds.cache.size}**`, inline: true },
        { name: '👥 Usuários', value: `**${i.client.users.cache.size}**`, inline: true },
      );
    return i.editReply({ embeds: [embed] });
  }
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

async function adminButtons(i: ButtonInteraction, action: string) {
  if (!(await checkAdmin(i))) return;
  const guild = i.guild!;

  if (action === 'config') {
    const config = await getConfig(guild.id);
    const embed = baseEmbed(COLORS.DARK)
      .setTitle(`${EMOJIS.GEAR} Configurações do Servidor`)
      .addFields(
        { name: '📋 Canais', value: [
          `Log: ${config.logChannelId ? `<#${config.logChannelId}>` : '❌'}`,
          `Boas-vindas: ${config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : '❌'}`,
          `Level-up: ${config.levelUpChannelId ? `<#${config.levelUpChannelId}>` : '❌'}`,
          `Anúncios: ${config.announcementChannelId ? `<#${config.announcementChannelId}>` : '❌'}`,
          `Sugestões: ${config.suggestionChannelId ? `<#${config.suggestionChannelId}>` : '❌'}`,
          `Feedback: ${config.feedbackChannelId ? `<#${config.feedbackChannelId}>` : '❌'}`,
          `Ticket Log: ${config.ticketLogChannelId ? `<#${config.ticketLogChannelId}>` : '❌'}`,
        ].join('\n'), inline: true },
        { name: '🎭 Cargos', value: [
          `Admin: ${config.adminRoleId ? `<@&${config.adminRoleId}>` : '❌'}`,
          `Mod: ${config.modRoleId ? `<@&${config.modRoleId}>` : '❌'}`,
          `Membro: ${config.memberRoleId ? `<@&${config.memberRoleId}>` : '❌'}`,
          `Auto: ${config.autoRoleId ? `<@&${config.autoRoleId}>` : '❌'}`,
        ].join('\n'), inline: true },
        { name: '⚡ XP', value: [
          `Min/Max: **${config.xpMin}–${config.xpMax}** por msg`,
          `Cooldown: **${config.xpCooldown}s**`,
          `Anti-spam: **${config.antiSpam ? '✅' : '❌'}**`,
          `Anti-links: **${config.antiLinks ? '✅' : '❌'}**`,
        ].join('\n'), inline: false },
      );
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('config:channels').setLabel('Canais').setEmoji('📋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('config:roles').setLabel('Cargos').setEmoji('🎭').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('config:xp').setLabel('XP & Anti-spam').setEmoji('⚡').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:welcome').setLabel('Boas-vindas').setEmoji('👋').setStyle(ButtonStyle.Secondary),
    );
    return i.reply({ embeds: [embed], components: [row1], ephemeral: true });
  }

  if (action === 'allowlist') {
    await i.deferReply({ ephemeral: true });
    return showAllowlistPanel(i, false);
  }

  if (action === 'stats') {
    await i.deferReply({ ephemeral: true });
    const [totalMembers, totalWins, totalTickets, totalAchievements, topMember] = await Promise.all([
      prisma.member.count(),
      prisma.giveaway.count({ where: { guildId: guild.id } }),
      prisma.ticket.count(),
      prisma.achievement.count(),
      prisma.member.findFirst({ orderBy: [{ level: 'desc' }, { xp: 'desc' }] }),
    ]);
    const embed = baseEmbed(COLORS.GOLD)
      .setTitle(`📈 Estatísticas — ${guild.name}`)
      .addFields(
        { name: '👥 Membros cadastrados', value: `**${totalMembers}**`, inline: true },
        { name: '🎁 Sorteios realizados', value: `**${totalWins}**`, inline: true },
        { name: '🎫 Tickets abertos', value: `**${totalTickets}**`, inline: true },
        { name: '🏅 Conquistas concedidas', value: `**${totalAchievements}**`, inline: true },
        { name: '🏆 Membro #1', value: topMember ? `**${topMember.username}** (Nv ${topMember.level})` : 'N/A', inline: true },
      );
    return i.editReply({ embeds: [embed] });
  }

  if (action === 'anuncio') {
    const modal = new ModalBuilder().setCustomId('modal:anuncio').setTitle('Criar Anúncio');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('titulo').setLabel('Título').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('mensagem').setLabel('Mensagem').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(2000)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('canal').setLabel('ID do canal (vazio = canal atual)').setStyle(TextInputStyle.Short).setRequired(false)),
    );
    return i.showModal(modal);
  }

  if (action === 'poll') {
    const modal = new ModalBuilder().setCustomId('modal:poll').setTitle('Criar Enquete');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('pergunta').setLabel('Pergunta').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(200)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('opcoes').setLabel('Opções (uma por linha, máx 4)').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(400)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('duracao').setLabel('Duração (ex: 1h, 30m, 1d)').setStyle(TextInputStyle.Short).setRequired(false)),
    );
    return i.showModal(modal);
  }

  if (action === 'sorteio') {
    const modal = new ModalBuilder().setCustomId('modal:sorteio').setTitle('Criar Sorteio');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('premio').setLabel('Prêmio').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('vencedores').setLabel('Quantidade de vencedores').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('1').setMaxLength(2)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('duracao').setLabel('Duração (ex: 1h, 30m, 1d)').setStyle(TextInputStyle.Short).setRequired(true)),
    );
    return i.showModal(modal);
  }

  if (action === 'encerrar_sorteio') {
    const modal = new ModalBuilder().setCustomId('modal:encerrar_sorteio').setTitle('Encerrar Sorteio');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('id').setLabel('ID do sorteio').setStyle(TextInputStyle.Short).setRequired(true)),
    );
    return i.showModal(modal);
  }

  if (action === 'evento') {
    const modal = new ModalBuilder().setCustomId('modal:evento').setTitle('Criar Evento');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('titulo').setLabel('Título do evento').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('descricao').setLabel('Descrição').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(500)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('inicio').setLabel('Início (ex: 2h, 1d, 30m a partir de agora)').setStyle(TextInputStyle.Short).setRequired(true)),
    );
    return i.showModal(modal);
  }

  if (action === 'conquista') {
    const modal = new ModalBuilder().setCustomId('modal:conquista').setTitle('Gerenciar Conquistas');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('acao').setLabel('Ação: "criar" ou "dar"').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Nome da conquista').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(60)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('descricao').setLabel('Descrição (ao criar) ou ID do usuário (ao dar)').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('recompensa').setLabel('XP,Moedas de recompensa (ao criar, ex: 100,50)').setStyle(TextInputStyle.Short).setRequired(false)),
    );
    return i.showModal(modal);
  }

  if (action === 'nivel_reward') {
    const modal = new ModalBuilder().setCustomId('modal:nivel_reward').setTitle('Recompensa por Nível');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('nivel').setLabel('Nível').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('cargo').setLabel('ID do cargo (ou vazio para remover)').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('moedas').setLabel('Moedas de recompensa (padrão 0)').setStyle(TextInputStyle.Short).setRequired(false)),
    );
    return i.showModal(modal);
  }

  if (action === 'economia') {
    const modal = new ModalBuilder().setCustomId('modal:admin_economia').setTitle('Gerenciar Economia');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('acao').setLabel('Ação: "dar" ou "remover"').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('tipo').setLabel('Tipo: "moedas" ou "xp"').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('usuario').setLabel('ID ou @menção do usuário').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('quantidade').setLabel('Quantidade').setStyle(TextInputStyle.Short).setRequired(true)),
    );
    return i.showModal(modal);
  }

  if (action === 'loja') {
    const modal = new ModalBuilder().setCustomId('modal:admin_loja').setTitle('Gerenciar Loja');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('acao').setLabel('Ação: "criar" ou "remover"').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Nome do item').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('preco').setLabel('Preço em moedas (ao criar)').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('descricao').setLabel('Descrição (ao criar)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(150)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('cargo').setLabel('ID do cargo concedido (ao criar, opcional)').setStyle(TextInputStyle.Short).setRequired(false)),
    );
    return i.showModal(modal);
  }

  if (action === 'rank') {
    const modal = new ModalBuilder().setCustomId('modal:rank').setTitle('Definir Rank');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('usuario').setLabel('ID ou @menção do usuário').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('rank').setLabel(`Rank: ${RANKS.join(', ')}`).setStyle(TextInputStyle.Short).setRequired(true)),
    );
    return i.showModal(modal);
  }
}

// ─── MOD BUTTONS ─────────────────────────────────────────────────────────────

async function modButtons(i: ButtonInteraction, action: string) {
  if (!(await checkModerator(i))) return;

  const modals: Record<string, { title: string; fields: { id: string; label: string; placeholder?: string; long?: boolean }[] }> = {
    ban:          { title: '🔨 Banir Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }, { id: 'motivo', label: 'Motivo' }, { id: 'dias', label: 'Dias de mensagens a deletar (0-7)', placeholder: '0' }] },
    kick:         { title: '👟 Expulsar Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }, { id: 'motivo', label: 'Motivo' }] },
    mute:         { title: '🔇 Mutar Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }, { id: 'duracao', label: 'Duração (ex: 10m, 1h, 1d)' }, { id: 'motivo', label: 'Motivo' }] },
    unmute:       { title: '🔊 Desmutar Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }] },
    warn:         { title: '⚠️ Advertir Membro', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }, { id: 'motivo', label: 'Motivo' }] },
    warns:        { title: '📋 Ver Avisos', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }] },
    limpar:       { title: '🗑️ Limpar Mensagens', fields: [{ id: 'quantidade', label: 'Quantidade (1-100)', placeholder: '10' }] },
    unban:        { title: '🚫 Desbanir Usuário', fields: [{ id: 'usuario', label: 'ID do usuário' }, { id: 'motivo', label: 'Motivo (opcional)' }] },
    remover_warn: { title: '🔄 Remover Aviso', fields: [{ id: 'usuario', label: 'ID ou @menção do usuário' }] },
    slowmode:     { title: '🐢 Slowmode', fields: [{ id: 'segundos', label: 'Segundos (0 para desativar)' }] },
    lock:         { title: '🔒 Trancar Canal', fields: [{ id: 'motivo', label: 'Motivo (opcional)' }] },
    unlock:       { title: '🔓 Destrancar Canal', fields: [{ id: 'motivo', label: 'Motivo (opcional)' }] },
  };

  const cfg = modals[action];
  if (!cfg) return;

  const modal = new ModalBuilder().setCustomId(`mod_modal:${action}`).setTitle(cfg.title);
  modal.addComponents(
    ...cfg.fields.map(f =>
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(f.id)
          .setLabel(f.label)
          .setStyle(f.long ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(f.id !== 'motivo' || action === 'warn' || action === 'ban' || action === 'kick')
          .setPlaceholder(f.placeholder ?? '')
      )
    )
  );
  return i.showModal(modal);
}

// ─── CONFIG BUTTONS ───────────────────────────────────────────────────────────

async function configButtons(i: ButtonInteraction, action: string, extra: string[]) {
  if (!(await checkAdmin(i))) return;

  if (action === 'channels') {
    const modal = new ModalBuilder().setCustomId('modal:config:channels').setTitle('Configurar Canais');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('log').setLabel('ID — Canal de Logs').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('welcome').setLabel('ID — Canal de Boas-vindas').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('levelup').setLabel('ID — Canal de Level-up').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('suggestion').setLabel('ID — Canal de Sugestões').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('ticket_log').setLabel('ID — Canal de Log de Tickets').setStyle(TextInputStyle.Short).setRequired(false)),
    );
    return i.showModal(modal);
  }

  if (action === 'roles') {
    const modal = new ModalBuilder().setCustomId('modal:config:roles').setTitle('Configurar Cargos');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('admin').setLabel('ID — Cargo de Admin').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('mod').setLabel('ID — Cargo de Moderador').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('member').setLabel('ID — Cargo de Membro (auto ao entrar)').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('auto').setLabel('ID — Cargo automático ao entrar').setStyle(TextInputStyle.Short).setRequired(false)),
    );
    return i.showModal(modal);
  }

  if (action === 'xp') {
    const config = await getConfig(i.guild!.id);
    const modal = new ModalBuilder().setCustomId('modal:config:xp').setTitle('Configurar XP & Proteções');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('xp_min').setLabel('XP mínimo por mensagem').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.xpMin))),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('xp_max').setLabel('XP máximo por mensagem').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.xpMax))),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('cooldown').setLabel('Cooldown em segundos').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.xpCooldown))),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('antispam').setLabel('Anti-spam (true/false)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.antiSpam))),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('antilinks').setLabel('Anti-links (true/false)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder(String(config.antiLinks))),
    );
    return i.showModal(modal);
  }

  if (action === 'welcome') {
    const config = await getConfig(i.guild!.id);
    const modal = new ModalBuilder().setCustomId('modal:config:welcome').setTitle('Mensagem de Boas-vindas');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('mensagem').setLabel('Mensagem ({user} = menção, {server} = servidor)').setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder(config.welcomeMessage ?? 'Bem-vindo(a) {user} à {server}!').setMaxLength(500)
      ),
    );
    return i.showModal(modal);
  }
}

// ─── TICKET BUTTONS ───────────────────────────────────────────────────────────

async function ticketButtons(i: ButtonInteraction, action: string, extra: string[]) {
  if (action === 'open') {
    await i.deferReply({ ephemeral: true });
    const config = await getConfig(i.guild!.id);
    const embed = baseEmbed().setTitle(`${EMOJIS.TICKET} Abrir Ticket`).setDescription('Selecione a categoria do seu ticket:');
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder().setCustomId('ticket:category').setPlaceholder('Selecione uma categoria').addOptions(
        new StringSelectMenuOptionBuilder().setLabel('Suporte Geral').setValue('suporte').setEmoji('🛠️'),
        new StringSelectMenuOptionBuilder().setLabel('Parceria').setValue('parceria').setEmoji('🤝'),
        new StringSelectMenuOptionBuilder().setLabel('Reporte').setValue('reporte').setEmoji('🚨'),
        new StringSelectMenuOptionBuilder().setLabel('Candidatura').setValue('candidatura').setEmoji('📋'),
        new StringSelectMenuOptionBuilder().setLabel('Outro').setValue('outro').setEmoji('❓'),
      )
    );
    return i.editReply({ embeds: [embed], components: [row] });
  }

  if (action === 'close') {
    const [ticketId] = extra;
    if (!(await checkModerator(i))) return;
    await i.deferReply({ ephemeral: true });
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Ticket não encontrado.')] });
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: 'closed', closedAt: new Date() } });
    const config = await getConfig(i.guild!.id);
    if (config.ticketLogChannelId) {
      const ch = i.guild?.channels.cache.get(config.ticketLogChannelId) as TextChannel | undefined;
      if (ch) await ch.send({ embeds: [baseEmbed(COLORS.ERROR).setTitle('🎫 Ticket Fechado').addFields({ name: 'Fechado por', value: `${i.user.tag}`, inline: true }, { name: 'Canal', value: `${ticket.channelId}`, inline: true })] });
    }
    await i.editReply({ embeds: [successEmbed('Ticket Fechado', 'Este canal será deletado em 5 segundos.')] });
    setTimeout(async () => {
      const ch = i.guild?.channels.cache.get(ticket.channelId);
      if (ch) await ch.delete().catch(() => null);
    }, 5000);
  }

  if (action === 'claim') {
    const [ticketId] = extra;
    if (!(await checkModerator(i))) return;
    await i.deferReply({ ephemeral: true });
    await prisma.ticket.update({ where: { id: ticketId }, data: { claimedBy: i.user.id } });
    await i.editReply({ embeds: [successEmbed('Ticket Assumido', `Você assumiu este ticket.`)] });
    const ch = i.channel as TextChannel | null;
    if (ch) await ch.send({ embeds: [baseEmbed(COLORS.INFO).setDescription(`${EMOJIS.SHIELD} Ticket assumido por ${i.user}.`)] });
  }
}

// ─── POLL VOTE ────────────────────────────────────────────────────────────────

async function pollVote(i: ButtonInteraction, extra: string[]) {
  const [pollId, optionId] = extra;
  await i.deferReply({ ephemeral: true });
  const option = await prisma.pollOption.findUnique({ where: { id: optionId } });
  if (!option) return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Opção não encontrada.')] });
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll || poll.ended) return i.editReply({ embeds: [warningEmbed('Encerrada', 'Esta enquete já foi encerrada.')] });
  if (option.voters.includes(i.user.id)) return i.editReply({ embeds: [warningEmbed('Já votou', 'Você já votou nesta opção.')] });
  const allOptions = await prisma.pollOption.findMany({ where: { pollId } });
  const alreadyVoted = allOptions.some(o => o.voters.includes(i.user.id));
  if (alreadyVoted) {
    await prisma.pollOption.updateMany({ where: { pollId, voters: { has: i.user.id } }, data: { votes: { decrement: 1 } } });
    for (const o of allOptions) {
      if (o.voters.includes(i.user.id)) {
        await prisma.pollOption.update({ where: { id: o.id }, data: { voters: o.voters.filter(v => v !== i.user.id) } });
      }
    }
  }
  await prisma.pollOption.update({ where: { id: optionId }, data: { votes: { increment: 1 }, voters: { push: i.user.id } } });
  await i.editReply({ embeds: [successEmbed('Voto Registrado!', `Você votou em **${option.label}**.`)] });
}

// ─── GIVEAWAY JOIN ────────────────────────────────────────────────────────────

async function giveawayJoin(i: ButtonInteraction, extra: string[]) {
  const [giveawayId] = extra;
  await i.deferReply({ ephemeral: true });
  const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
  if (!giveaway || giveaway.ended) return i.editReply({ embeds: [errorEmbed('Encerrado', 'Este sorteio já foi encerrado.')] });
  const member = await prisma.member.upsert({ where: { discordId: i.user.id }, update: {}, create: { discordId: i.user.id, username: i.user.username } });
  const exists = await prisma.giveawayEntry.findUnique({ where: { giveawayId_memberId: { giveawayId, memberId: member.id } } });
  if (exists) return i.editReply({ embeds: [warningEmbed('Já Participando', 'Você já está participando deste sorteio!')] });
  await prisma.giveawayEntry.create({ data: { giveawayId, memberId: member.id } });
  const count = await prisma.giveawayEntry.count({ where: { giveawayId } });
  try {
    const ch = i.guild?.channels.cache.get(giveaway.channelId) as TextChannel | undefined;
    if (ch && giveaway.messageId) {
      const msg = await ch.messages.fetch(giveaway.messageId);
      if (msg.embeds[0]) await msg.edit({ embeds: [EmbedBuilder.from(msg.embeds[0]).setFooter({ text: `${count} participante${count !== 1 ? 's' : ''} • ⚔️ Aliança Skyline` })] });
    }
  } catch { /* ignore */ }
  await i.editReply({ embeds: [successEmbed('Inscrito!', `Você entrou no sorteio de **${giveaway.prize}**! 🎉`)] });
}

// ─── EVENT JOIN ───────────────────────────────────────────────────────────────

async function eventJoin(i: ButtonInteraction, extra: string[]) {
  const [eventId] = extra;
  await i.deferReply({ ephemeral: true });
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ended) return i.editReply({ embeds: [errorEmbed('Encerrado', 'Este evento já foi encerrado.')] });
  const member = await prisma.member.upsert({ where: { discordId: i.user.id }, update: {}, create: { discordId: i.user.id, username: i.user.username } });
  const exists = await prisma.eventParticipant.findUnique({ where: { eventId_memberId: { eventId, memberId: member.id } } });
  if (exists) return i.editReply({ embeds: [warningEmbed('Já Inscrito', 'Você já está inscrito neste evento!')] });
  await prisma.eventParticipant.create({ data: { eventId, memberId: member.id } });
  const count = await prisma.eventParticipant.count({ where: { eventId } });
  await i.editReply({ embeds: [successEmbed('Inscrito!', `Você está inscrito no evento **${event.title}**! 👥 ${count} inscritos.`)] });
}

// ─── LOJA ─────────────────────────────────────────────────────────────────────

async function lojaButtons(i: ButtonInteraction, action: string, extra: string[]) {
  if (action === 'comprar') {
    const [itemId] = extra;
    await i.deferReply({ ephemeral: true });
    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item || !item.active) return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Item não encontrado.')] });
    if (item.stock === 0) return i.editReply({ embeds: [warningEmbed('Esgotado', 'Este item está sem estoque.')] });
    const member = await getOrCreateMember(i.user.id, i.user.username);
    if (member.coins < item.price) return i.editReply({ embeds: [warningEmbed('Saldo insuficiente', `Você tem **${member.coins}** moedas. Este item custa **${item.price}**.`)] });
    const guildMember = i.member as GuildMember;
    if (item.roleId && guildMember.roles.cache.has(item.roleId)) return i.editReply({ embeds: [warningEmbed('Já possui', 'Você já tem o cargo deste item.')] });
    await prisma.$transaction(async tx => {
      await tx.member.update({ where: { discordId: i.user.id }, data: { coins: { decrement: item.price } } });
      await tx.shopPurchase.create({ data: { itemId: item.id, memberId: i.user.id, guildId: i.guild!.id } });
      if (item.stock > 0) await tx.shopItem.update({ where: { id: item.id }, data: { stock: { decrement: 1 } } });
    });
    if (item.roleId) { try { await guildMember.roles.add(item.roleId); } catch { /* ignore */ } }
    await i.editReply({ embeds: [successEmbed('Compra Realizada!', `Você comprou **${item.name}**!\n${EMOJIS.COINS} Novo saldo: **${member.coins - item.price}** moedas${item.roleId ? `\n${EMOJIS.SHIELD} Cargo: <@&${item.roleId}>` : ''}`)] });
  }
}

// ─── MISSÕES ──────────────────────────────────────────────────────────────────

async function missoesButtons(i: ButtonInteraction, action: string) {
  if (action === 'resgatar') {
    await i.deferReply({ ephemeral: true });
    const today = new Date().toISOString().slice(0, 10);
    await ensureDailyMissions(i.user.id, i.guild!.id);
    const claimable = await prisma.dailyMission.findMany({ where: { memberId: i.user.id, guildId: i.guild!.id, dateStr: today, completed: true, claimed: false } });
    if (!claimable.length) return i.editReply({ embeds: [errorEmbed('Nada para resgatar', 'Complete missões primeiro ou já resgatou tudo hoje.')] });
    const totalXp = claimable.reduce((a, m) => a + m.xpReward, 0);
    const totalCoins = claimable.reduce((a, m) => a + m.coinReward, 0);
    await prisma.$transaction([
      ...claimable.map(m => prisma.dailyMission.update({ where: { id: m.id }, data: { claimed: true } })),
      prisma.member.update({ where: { discordId: i.user.id }, data: { xp: { increment: totalXp }, coins: { increment: totalCoins } } }),
    ]);
    const lines = claimable.map(m => `✅ **${missionLabel(m.type)}** — ${EMOJIS.XP} +${m.xpReward} XP • ${EMOJIS.COINS} +${m.coinReward} moedas`).join('\n');
    await i.editReply({ embeds: [successEmbed('Recompensas Resgatadas!', `${lines}\n\n**Total:** ${EMOJIS.XP} +${totalXp} XP • ${EMOJIS.COINS} +${totalCoins} moedas`)] });
  }
}

// ─── ECONOMIA ─────────────────────────────────────────────────────────────────

async function economiaButtons(i: ButtonInteraction, action: string) {
  if (action === 'transferir') {
    const modal = new ModalBuilder().setCustomId('modal:transferir').setTitle('Transferir Moedas');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('usuario').setLabel('ID ou @menção do destinatário').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('quantidade').setLabel('Quantidade de moedas').setStyle(TextInputStyle.Short).setRequired(true)),
    );
    return i.showModal(modal);
  }
}

// ─── ALLOWLIST ────────────────────────────────────────────────────────────────

async function allowlistButtons(i: ButtonInteraction, action: string) {
  if (!isBotManager(i.user.id)) {
    const e = errorEmbed('Acesso Negado', 'Apenas donos e managers do bot podem acessar este painel.');
    if (i.replied || i.deferred) return i.followUp({ embeds: [e], ephemeral: true });
    return i.reply({ embeds: [e], ephemeral: true });
  }

  if (action === 'panel') {
    await i.deferReply({ ephemeral: true });
    return showAllowlistPanel(i, false);
  }

  // Mostrar modal para adicionar / remover servidor
  if (action === 'add_guild') {
    const modal = new ModalBuilder().setCustomId('modal:allowlist_add_guild').setTitle('Autorizar Servidor');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('guild_id').setLabel('ID do servidor').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678'),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('nota').setLabel('Nota (opcional)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(100),
      ),
    );
    return i.showModal(modal);
  }

  if (action === 'remove_guild') {
    const modal = new ModalBuilder().setCustomId('modal:allowlist_remove_guild').setTitle('Revogar Servidor');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('guild_id').setLabel('ID do servidor').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678'),
      ),
    );
    return i.showModal(modal);
  }

  if (action === 'add_manager') {
    const modal = new ModalBuilder().setCustomId('modal:allowlist_add_manager').setTitle('Adicionar Manager');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('user_id').setLabel('ID do usuário Discord').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678'),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('username').setLabel('Nome (para referência)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(50),
      ),
    );
    return i.showModal(modal);
  }

  if (action === 'remove_manager') {
    const modal = new ModalBuilder().setCustomId('modal:allowlist_remove_manager').setTitle('Remover Manager');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('user_id').setLabel('ID do usuário a remover').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678'),
      ),
    );
    return i.showModal(modal);
  }
}

async function showAllowlistPanel(i: ButtonInteraction, update: boolean) {
  const guilds   = await prisma.allowedGuild.findMany({ where: { active: true }, orderBy: { addedAt: 'asc' } });
  const managers = await prisma.botManager.findMany({ orderBy: { addedAt: 'asc' } });
  const active   = isEnforcementActive();
  const count    = allowedGuildCount();
  const botIn    = i.client.guilds.cache.size;

  const guildLines = guilds.length
    ? guilds.map(g => {
        const live = i.client.guilds.cache.get(g.guildId);
        return `${live ? '🟢' : '⚫'} **${g.guildName ?? g.guildId}** \`${g.guildId}\`` + (g.note ? ` — ${g.note}` : '');
      }).join('\n')
    : '*Nenhum servidor autorizado — modo bootstrap ativo (todos podem usar o bot)*';

  const ownerIds   = getOwnerIds();
  const ownerLines = ownerIds.map(id => `👑 <@${id}> — Dono (env)`).join('\n') || '*Nenhum OWNER_ID configurado*';
  const mgrLines   = managers.length
    ? managers.map(m => `🔧 <@${m.userId}>${m.username ? ` — ${m.username}` : ''}`).join('\n')
    : '*Nenhum manager adicionado*';

  const embed = baseEmbed(active ? COLORS.SUCCESS : COLORS.WARNING)
    .setTitle('🌐 Gerenciamento de Acesso (Allowlist)')
    .addFields(
      { name: '📋 Modo atual', value: active ? `🔒 **Enforcement ativo** — apenas servidores da lista podem usar o bot` : '🔓 **Bootstrap** — qualquer servidor pode usar o bot', inline: false },
      { name: `✅ Servidores autorizados (${guilds.length})`, value: guildLines.slice(0, 1000), inline: false },
      { name: `👑 Donos`, value: ownerLines, inline: true },
      { name: `🔧 Managers (${managers.length})`, value: mgrLines, inline: true },
      { name: '🤖 Bot está em', value: `**${botIn}** servidor(es)`, inline: true },
    )
    .setFooter({ text: '🟢 = bot está no servidor  ⚫ = bot não está lá' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('allowlist:add_guild').setLabel('+ Servidor').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('allowlist:remove_guild').setLabel('− Servidor').setEmoji('🚫').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('allowlist:add_manager').setLabel('+ Manager').setEmoji('🔧').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('allowlist:remove_manager').setLabel('− Manager').setEmoji('👤').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('refresh:allowlist').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
  );

  const payload = { embeds: [embed], components: [row] };
  return update ? (i as any).update(payload) : i.editReply(payload);
}

// ─── REFRESH BUTTONS (atualizam in-place com i.update) ───────────────────────

async function refreshButtons(i: ButtonInteraction, action: string) {
  const guild = i.guild!;

  if (action === 'ranking' || action === 'ranking_coins') {
    const byCoins = action === 'ranking_coins';
    const top = byCoins
      ? await prisma.member.findMany({ orderBy: { coins: 'desc' }, take: 10 })
      : await prisma.member.findMany({ orderBy: [{ level: 'desc' }, { xp: 'desc' }], take: 10 });
    const medals = ['🥇', '🥈', '🥉'];
    const list = byCoins
      ? top.map((m, idx) => `${medals[idx] ?? `**${idx + 1}.**`} **${m.username}** — ${EMOJIS.COINS} ${m.coins.toLocaleString('pt-BR')} moedas`).join('\n')
      : top.map((m, idx) => `${medals[idx] ?? `**${idx + 1}.**`} ${rankEmoji(m.rank)} **${m.username}** — Nv ${m.level} • ${m.xp} XP`).join('\n');
    const title = byCoins ? `${EMOJIS.TROPHY} Top 10 — Mais Ricos` : `${EMOJIS.TROPHY} Top 10 — Ranking`;
    const embed = baseEmbed(COLORS.GOLD).setTitle(title).setDescription(list || 'Nenhum membro.');
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(byCoins ? 'refresh:ranking' : 'refresh:ranking_coins').setLabel(byCoins ? 'Por XP' : 'Mais Ricos').setEmoji(byCoins ? '💜' : '🪙').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`refresh:${action}`).setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    );
    return i.update({ embeds: [embed], components: [row] });
  }

  if (action === 'missoes') {
    await ensureDailyMissions(i.user.id, guild.id);
    const today = new Date().toISOString().slice(0, 10);
    const missions = await prisma.dailyMission.findMany({ where: { memberId: i.user.id, guildId: guild.id, dateStr: today } });
    const lines = missions.map(m => {
      const bar = buildBar(m.progress, m.target);
      const status = m.completed ? (m.claimed ? '✅ Resgatada' : '🎁 **Concluída!**') : `${m.progress}/${m.target}`;
      return `**${missionLabel(m.type)}**\n\`${bar}\` ${status}\n> ${EMOJIS.XP} +${m.xpReward} XP • ${EMOJIS.COINS} +${m.coinReward} moedas`;
    }).join('\n\n');
    const pending = missions.some(m => m.completed && !m.claimed);
    const embed = baseEmbed(COLORS.INFO)
      .setTitle(`${EMOJIS.FIRE} Missões Diárias — ${today}`)
      .setDescription(lines || 'Nenhuma missão disponível.')
      .setFooter({ text: '⚔️ Aliança Skyline • Renovam à meia-noite' });
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('missoes:resgatar').setLabel('Resgatar').setEmoji('🎁').setStyle(pending ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(!pending),
      new ButtonBuilder().setCustomId('refresh:missoes').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    );
    return i.update({ embeds: [embed], components: [row] });
  }

  if (action === 'servidor') {
    const today = new Date().toISOString().slice(0, 10);
    const [totalMembers, config, stat] = await Promise.all([
      prisma.member.count(),
      getConfig(guild.id),
      prisma.serverStat.findUnique({ where: { guildId_date: { guildId: guild.id, date: today } } }),
    ]);
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const embed = baseEmbed(COLORS.INFO)
      .setTitle(`${EMOJIS.CHART} ${guild.name}`)
      .setThumbnail(guild.iconURL() ?? null)
      .addFields(
        { name: '👥 Membros', value: `**${guild.memberCount}** (${bots} bots)`, inline: true },
        { name: '📊 No banco', value: `**${totalMembers}**`, inline: true },
        { name: '💬 Canais', value: `**${guild.channels.cache.size}**`, inline: true },
        { name: '🎭 Cargos', value: `**${guild.roles.cache.size}**`, inline: true },
        { name: '😀 Emojis', value: `**${guild.emojis.cache.size}**`, inline: true },
        { name: '🚀 Boosts', value: `**${guild.premiumSubscriptionCount ?? 0}** (Tier ${guild.premiumTier})`, inline: true },
        { name: '📅 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
        { name: '📋 Log', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Não configurado', inline: true },
        { name: '📈 Hoje — Entradas', value: `**${stat?.joins ?? 0}**`, inline: true },
        { name: '📉 Hoje — Saídas',   value: `**${stat?.leaves ?? 0}**`, inline: true },
        { name: '🔨 Hoje — Bans',     value: `**${stat?.bans ?? 0}**`, inline: true },
        { name: '💬 Hoje — Mensagens', value: `**${(stat?.messages ?? 0).toLocaleString('pt-BR')}**`, inline: true },
      );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('painel:rede').setLabel('Rede Aliança').setEmoji('🌐').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('refresh:servidor').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    );
    return i.update({ embeds: [embed], components: [row] });
  }

  if (action === 'rede') {
    const today = new Date().toISOString().slice(0, 10);
    const guilds = i.client.guilds.cache;
    const guildIds = [...guilds.keys()];
    const stats = await prisma.serverStat.findMany({ where: { guildId: { in: guildIds }, date: today } });
    const statMap = new Map(stats.map(s => [s.guildId, s]));
    let totalHumans = 0, totalBots = 0, totalJoins = 0, totalLeaves = 0, totalBans = 0, totalMsgs = 0;
    const lines: string[] = [];
    for (const [id, g] of guilds) {
      const bots = g.members.cache.filter(m => m.user.bot).size;
      const humans = g.memberCount - bots;
      const s = statMap.get(id);
      totalHumans += humans; totalBots += bots;
      totalJoins += s?.joins ?? 0; totalLeaves += s?.leaves ?? 0;
      totalBans += s?.bans ?? 0; totalMsgs += s?.messages ?? 0;
      lines.push(`**${g.name}** — ${g.memberCount} membros${s ? ` • +${s.joins}/${s.leaves}/${s.bans}🔨` : ''}`);
    }
    const embed = baseEmbed(COLORS.DARK)
      .setTitle(`🌐 Rede Aliança Skyline — ${guilds.size} servidor(es)`)
      .addFields(
        { name: '👥 Total membros', value: `**${(totalHumans + totalBots).toLocaleString('pt-BR')}** (${totalBots} bots)`, inline: true },
        { name: '📈 Hoje — Entradas', value: `**${totalJoins}**`, inline: true },
        { name: '📉 Hoje — Saídas',   value: `**${totalLeaves}**`, inline: true },
        { name: '🔨 Hoje — Bans',     value: `**${totalBans}**`, inline: true },
        { name: '💬 Hoje — Mensagens', value: `**${totalMsgs.toLocaleString('pt-BR')}**`, inline: true },
        { name: `📋 Servidores (${guilds.size})`, value: lines.slice(0, 10).join('\n') || '—', inline: false },
      )
      .setFooter({ text: '+entradas/saídas/bans hoje • ⚔️ Aliança Skyline' });
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('refresh:rede').setLabel('Atualizar').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    );
    return i.update({ embeds: [embed], components: [row] });
  }

  if (action === 'allowlist') {
    return showAllowlistPanel(i, true);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function buildBar(progress: number, target: number, length = 10): string {
  const filled = Math.min(length, Math.round((Math.min(progress, target) / target) * length));
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function missionLabel(type: string): string {
  const map: Record<string, string> = {
    enviar_mensagens: '💬 Enviar mensagens',
    ganhar_xp: '💜 Ganhar XP',
    estar_online: '🟢 Login diário',
  };
  return map[type] ?? type;
}

// ── /rpgwipe confirmation buttons ────────────────────────────────────────────
async function rpgwipeButtons(interaction: ButtonInteraction, action: string) {
  const { isOwner } = await import('../utils/permissions');

  if (!isOwner(interaction.user.id)) {
    return interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Apenas o dono do bot pode confirmar o wipe.')], ephemeral: true });
  }

  if (action === 'cancel') {
    return interaction.update({
      embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setTitle('✅ Wipe Cancelado').setDescription('Nenhum dado foi apagado.')],
      components: [],
    });
  }

  if (action === 'confirm') {
    await interaction.update({
      embeds: [new EmbedBuilder().setColor(COLORS.DARK).setTitle('⏳ Wipando...').setDescription('Apagando todos os dados de RPG. Aguarde...')],
      components: [],
    });

    // Deletar na ordem correta para respeitar FK
    const [chars, guilds] = await prisma.$transaction([
      prisma.rpgCombatLog.deleteMany(),
      prisma.rpgShopRotation.deleteMany(),
      prisma.rpgCraftQueue.deleteMany(),
      prisma.rpgLearnedSkill.deleteMany(),
      prisma.rpgGuildMember.deleteMany(),
      prisma.rpgInventoryItem.deleteMany(),
      prisma.rpgEquipment.deleteMany(),
      prisma.rpgCharacter.deleteMany(),
      prisma.rpgGuild.deleteMany(),
    ]).then(results => [results[7].count, results[8].count]); // char + guild counts

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('☢️ RPG Wipado com Sucesso')
          .setDescription(
            `Todos os dados de RPG foram apagados.\n\n` +
            `> 🧑 **${chars}** personagem(ns) deletado(s)\n` +
            `> 🏛️ **${guilds}** guilda(s) deletada(s)\n` +
            `> Inventários, equipamentos, habilidades, logs e crafts também removidos.`
          )
          .setFooter({ text: `Executado por ${interaction.user.username}` })
          .setTimestamp(),
      ],
    });
  }
}
