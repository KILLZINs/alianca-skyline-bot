import {
  ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { prisma } from '../database/client';
import { COLORS, EMOJIS, baseEmbed, successEmbed, errorEmbed, warningEmbed, rankEmoji, levelBar, colorFromLevel } from '../utils/embeds';
import { getOrCreateMember, getConfig } from '../utils/helpers';
import { xpForNextLevel } from '../types';
import { checkAdmin, checkModerator } from '../utils/permissions';

export async function handleButton(interaction: ButtonInteraction) {
  const parts = interaction.customId.split(':');
  const prefix = parts[0];
  const action = parts[1];
  const extra = parts.slice(2);

  try {
    switch (prefix) {
      case 'painel':   return await painelButtons(interaction, action);
      case 'admin':    return await adminButtons(interaction, action);
      case 'ticket':   return await ticketButtons(interaction, action, extra);
      case 'config':   return await configButtons(interaction, action, extra);
      case 'mod':      return await modButtons(interaction, action);
      case 'poll':     return await pollVote(interaction, extra);
      case 'giveaway': return await giveawayJoin(interaction, extra);
      case 'event':    return await eventJoin(interaction, extra);
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
    const m = await getOrCreateMember(i.user.id, i.user.username);
    const xpNeeded = xpForNextLevel(m.level);
    const embed = baseEmbed(colorFromLevel(m.level))
      .setTitle(`${EMOJIS.PERSON} Perfil de ${i.user.username}`)
      .setThumbnail(i.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🏅 Rank', value: `${rankEmoji(m.rank)} **${m.rank}**`, inline: true },
        { name: '🎯 Nível', value: `**${m.level}**`, inline: true },
        { name: '🪙 Moedas', value: `**${m.coins}**`, inline: true },
        { name: '💜 XP', value: `${m.xp}/${xpNeeded}\n\`${levelBar(m.xp, xpNeeded)}\``, inline: false },
        { name: '⚠️ Avisos', value: `**${m.warnings}**`, inline: true },
      );
    return i.reply({ embeds: [embed], ephemeral: true });
  }

  if (action === 'nivel') {
    const m = await getOrCreateMember(i.user.id, i.user.username);
    const xpNeeded = xpForNextLevel(m.level);
    const rankPos = await prisma.member.count({ where: { level: { gt: m.level } } });
    const embed = baseEmbed(colorFromLevel(m.level))
      .setTitle(`${EMOJIS.LEVEL} Nível de ${i.user.username}`)
      .setThumbnail(i.user.displayAvatarURL())
      .setDescription(
        `${rankEmoji(m.rank)} **${m.rank}**\n\n` +
        `**Nível ${m.level}** — ${m.xp}/${xpNeeded} XP\n\`${levelBar(m.xp, xpNeeded)}\`\n\n📊 Posição: **#${rankPos + 1}**`
      );
    return i.reply({ embeds: [embed], ephemeral: true });
  }

  if (action === 'ranking') {
    const top = await prisma.member.findMany({ orderBy: [{ level: 'desc' }, { xp: 'desc' }], take: 10 });
    const medals = ['🥇', '🥈', '🥉'];
    const list = top.map((m, idx) =>
      `${medals[idx] ?? `**${idx + 1}.**`} ${rankEmoji(m.rank)} **${m.username}** — Nv ${m.level} • ${m.xp} XP`
    ).join('\n');
    const embed = baseEmbed(COLORS.GOLD).setTitle(`${EMOJIS.TROPHY} Top 10 — Aliança Skyline`).setDescription(list || 'Nenhum membro.');
    return i.reply({ embeds: [embed], ephemeral: true });
  }

  if (action === 'info') {
    const g = guild;
    const embed = baseEmbed()
      .setTitle(`📊 ${g.name}`)
      .setThumbnail(g.iconURL())
      .addFields(
        { name: '👥 Membros', value: `**${g.memberCount}**`, inline: true },
        { name: '📅 Criado em', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '💎 Boosts', value: `**${g.premiumSubscriptionCount ?? 0}**`, inline: true },
        { name: '📣 Canais', value: `**${g.channels.cache.size}**`, inline: true },
        { name: '📋 Cargos', value: `**${g.roles.cache.size}**`, inline: true },
        { name: '🌍 Locale', value: `**${g.preferredLocale}**`, inline: true },
      );
    return i.reply({ embeds: [embed], ephemeral: true });
  }

  if (action === 'ticket') {
    const select = new StringSelectMenuBuilder().setCustomId('ticket:category').setPlaceholder('Escolha o tipo de ticket...')
      .addOptions([
        new StringSelectMenuOptionBuilder().setLabel('Suporte Geral').setValue('suporte').setEmoji('🛠️').setDescription('Dúvidas e problemas gerais'),
        new StringSelectMenuOptionBuilder().setLabel('Parceria').setValue('parceria').setEmoji('🤝').setDescription('Pedidos de parceria'),
        new StringSelectMenuOptionBuilder().setLabel('Reporte').setValue('reporte').setEmoji('🚨').setDescription('Reportar usuário ou bug'),
        new StringSelectMenuOptionBuilder().setLabel('Candidatura').setValue('candidatura').setEmoji('📋').setDescription('Candidatura para staff'),
        new StringSelectMenuOptionBuilder().setLabel('Outro').setValue('outro').setEmoji('❓').setDescription('Outros assuntos'),
      ]);
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const embed = baseEmbed().setTitle(`${EMOJIS.TICKET} Criar Ticket`).setDescription('Selecione a categoria do seu ticket:');
    return i.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (action === 'sorteios') {
    const gs = await prisma.giveaway.findMany({ where: { guildId: guild.id, ended: false }, orderBy: { endsAt: 'asc' }, take: 5 });
    if (!gs.length) return i.reply({ embeds: [baseEmbed().setTitle('🎁 Sorteios').setDescription('Nenhum sorteio ativo.')], ephemeral: true });
    const list = gs.map(g => `🎁 **${g.prize}** — encerra <t:${Math.floor(g.endsAt.getTime() / 1000)}:R>`).join('\n');
    return i.reply({ embeds: [baseEmbed(COLORS.GOLD).setTitle('🎁 Sorteios Ativos').setDescription(list)], ephemeral: true });
  }

  if (action === 'eventos') {
    const evs = await prisma.event.findMany({ where: { guildId: guild.id, ended: false }, orderBy: { startsAt: 'asc' }, take: 5, include: { _count: { select: { participants: true } } } });
    if (!evs.length) return i.reply({ embeds: [baseEmbed().setTitle('📌 Eventos').setDescription('Nenhum evento ativo.')], ephemeral: true });
    const list = evs.map(e => `📌 **${e.title}** — <t:${Math.floor(e.startsAt.getTime() / 1000)}:R> — 👥 ${e._count.participants}`).join('\n');
    return i.reply({ embeds: [baseEmbed().setTitle('📌 Eventos Ativos').setDescription(list)], ephemeral: true });
  }

  if (action === 'ajuda') {
    const embed = baseEmbed()
      .setTitle(`${EMOJIS.SCROLL} Ajuda — Aliança Skyline`)
      .addFields(
        { name: '🎮 Geral', value: '`/painel` `/ping` `/serverinfo`', inline: false },
        { name: '👤 Membros', value: '`/perfil` `/nivel` `/leaderboard` `/rank`', inline: false },
        { name: '🎫 Tickets', value: 'Botão 🎫 no `/painel`', inline: false },
        { name: '🎁 Sorteios', value: '`/giveaway criar` (admin)', inline: false },
        { name: '📊 Polls', value: '`/poll criar` (admin)', inline: false },
        { name: '📌 Eventos', value: '`/evento criar` (admin)', inline: false },
        { name: '⚙️ Admin', value: '`/admin` `/config` `/moderacao`', inline: false },
      );
    return i.reply({ embeds: [embed], ephemeral: true });
  }
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

async function adminButtons(i: ButtonInteraction, action: string) {
  if (!(await checkAdmin(i))) return;

  if (action === 'config') {
    const cfg = await getConfig(i.guild!.id);
    const embed = baseEmbed(COLORS.DARK)
      .setTitle(`${EMOJIS.GEAR} Configuração do Servidor`)
      .addFields(
        { name: '📋 Log', value: cfg.logChannelId ? `<#${cfg.logChannelId}>` : '`Não definido`', inline: true },
        { name: '👋 Boas-vindas', value: cfg.welcomeChannelId ? `<#${cfg.welcomeChannelId}>` : '`Não definido`', inline: true },
        { name: '📢 Anúncios', value: cfg.announcementChannelId ? `<#${cfg.announcementChannelId}>` : '`Não definido`', inline: true },
        { name: '🎫 Cat. Tickets', value: cfg.ticketCategoryId ? `<#${cfg.ticketCategoryId}>` : '`Não definido`', inline: true },
        { name: '🆙 Level-Up', value: cfg.levelUpChannelId ? `<#${cfg.levelUpChannelId}>` : '`Não definido`', inline: true },
        { name: '💡 Sugestões', value: cfg.suggestionChannelId ? `<#${cfg.suggestionChannelId}>` : '`Não definido`', inline: true },
        { name: '👑 Cargo Admin', value: cfg.adminRoleId ? `<@&${cfg.adminRoleId}>` : '`Não definido`', inline: true },
        { name: '🛡️ Cargo Mod', value: cfg.modRoleId ? `<@&${cfg.modRoleId}>` : '`Não definido`', inline: true },
        { name: '⭐ Cargo Membro', value: cfg.memberRoleId ? `<@&${cfg.memberRoleId}>` : '`Não definido`', inline: true },
      );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('config:canais').setLabel('Canais').setEmoji('#️⃣').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:cargos').setLabel('Cargos').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    );
    return i.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (action === 'mod') {
    const embed = baseEmbed(COLORS.ERROR).setTitle(`${EMOJIS.HAMMER} Painel de Moderação`).setDescription('Selecione uma ação abaixo:');
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('mod:ban').setLabel('Banir').setEmoji('🔨').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('mod:kick').setLabel('Expulsar').setEmoji('🥾').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('mod:mute').setLabel('Mutar').setEmoji('🔇').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('mod:unmute').setLabel('Desmutar').setEmoji('🔊').setStyle(ButtonStyle.Success),
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('mod:warn').setLabel('Advertir').setEmoji('⚠️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('mod:warns').setLabel('Ver Avisos').setEmoji('📋').setStyle(ButtonStyle.Secondary),
    );
    return i.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
  }

  const modals: Record<string, { title: string; fields: { id: string; label: string; required: boolean; style: TextInputStyle; maxLen?: number; placeholder?: string }[] }> = {
    anuncio: {
      title: '📢 Novo Anúncio',
      fields: [
        { id: 'titulo', label: 'Título', required: true, style: TextInputStyle.Short, maxLen: 100 },
        { id: 'mensagem', label: 'Conteúdo', required: true, style: TextInputStyle.Paragraph, maxLen: 2000 },
      ],
    },
    poll: {
      title: '📊 Criar Poll',
      fields: [
        { id: 'pergunta', label: 'Pergunta', required: true, style: TextInputStyle.Short, maxLen: 200 },
        { id: 'opcao1', label: 'Opção 1', required: true, style: TextInputStyle.Short, maxLen: 80 },
        { id: 'opcao2', label: 'Opção 2', required: true, style: TextInputStyle.Short, maxLen: 80 },
        { id: 'opcao3', label: 'Opção 3 (opcional)', required: false, style: TextInputStyle.Short, maxLen: 80 },
        { id: 'opcao4', label: 'Opção 4 (opcional)', required: false, style: TextInputStyle.Short, maxLen: 80 },
      ],
    },
    evento: {
      title: '🎉 Criar Evento',
      fields: [
        { id: 'titulo', label: 'Título', required: true, style: TextInputStyle.Short, maxLen: 100 },
        { id: 'descricao', label: 'Descrição', required: true, style: TextInputStyle.Paragraph, maxLen: 1000 },
        { id: 'data', label: 'Quando? (ex: 2h, 1d, 30m)', required: true, style: TextInputStyle.Short, maxLen: 20 },
      ],
    },
    sorteio: {
      title: '🎁 Criar Sorteio',
      fields: [
        { id: 'premio', label: 'Prêmio', required: true, style: TextInputStyle.Short, maxLen: 150 },
        { id: 'vencedores', label: 'Nº de vencedores', required: true, style: TextInputStyle.Short, maxLen: 2, placeholder: '1' },
        { id: 'duracao', label: 'Duração (ex: 1h, 2d, 30m)', required: true, style: TextInputStyle.Short, maxLen: 20 },
      ],
    },
    rank: {
      title: '👑 Definir Rank',
      fields: [
        { id: 'usuario', label: 'ID do usuário', required: true, style: TextInputStyle.Short },
        { id: 'rank', label: 'Novo rank', required: true, style: TextInputStyle.Short, placeholder: 'Recruta, Membro, Veterano, Elite, Capitão, Comandante, Líder' },
      ],
    },
  };

  const def = modals[action];
  if (!def) return;
  const modal = new ModalBuilder().setCustomId(`modal:${action}`).setTitle(def.title);
  for (const f of def.fields) {
    const inp = new TextInputBuilder().setCustomId(f.id).setLabel(f.label).setStyle(f.style).setRequired(f.required);
    if (f.maxLen) inp.setMaxLength(f.maxLen);
    if (f.placeholder) inp.setPlaceholder(f.placeholder);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(inp));
  }
  await i.showModal(modal);
}

// ─── TICKET ───────────────────────────────────────────────────────────────────

async function ticketButtons(i: ButtonInteraction, action: string, extra: string[]) {
  const guild = i.guild!;
  const [ticketId] = extra;

  if (action === 'close') {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return i.reply({ embeds: [errorEmbed('Erro', 'Ticket não encontrado.')], ephemeral: true });
    if (ticket.authorId !== i.user.id && !(await checkModerator(i))) return;

    const channel = guild.channels.cache.get(ticket.channelId) as TextChannel | undefined;
    if (channel) {
      await channel.send({ embeds: [baseEmbed(COLORS.ERROR).setTitle(`${EMOJIS.LOCK} Ticket Encerrado`).setDescription(`Encerrado por ${i.user}. Canal deletado em 5 segundos.`)] });
      setTimeout(() => channel.delete().catch(() => null), 5000);
    }
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: 'closed', closedAt: new Date() } });
    try { await i.reply({ embeds: [successEmbed('Ticket Encerrado', 'Ticket fechado com sucesso.')], ephemeral: true }); } catch { /* ignore */ }
    return;
  }

  if (action === 'claim') {
    if (!(await checkModerator(i))) return;
    await prisma.ticket.update({ where: { id: ticketId }, data: { claimedBy: i.user.id } });
    return i.reply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle(`${EMOJIS.SHIELD} Ticket Assumido`).setDescription(`${i.user} assumiu este ticket!`)] });
  }
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

async function configButtons(i: ButtonInteraction, action: string, extra: string[]) {
  if (!(await checkAdmin(i))) return;

  if (action === 'canais') {
    const embed = baseEmbed(COLORS.INFO).setTitle('#️⃣ Configurar Canais').setDescription('Clique para definir cada canal (você informará o ID):');
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('config:set:logChannelId').setLabel('Log').setEmoji('📋').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:set:welcomeChannelId').setLabel('Boas-vindas').setEmoji('👋').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:set:announcementChannelId').setLabel('Anúncios').setEmoji('📢').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:set:levelUpChannelId').setLabel('Level-Up').setEmoji('🆙').setStyle(ButtonStyle.Secondary),
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('config:set:ticketCategoryId').setLabel('Cat. Tickets').setEmoji('🎫').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:set:ticketLogChannelId').setLabel('Log Tickets').setEmoji('📁').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:set:suggestionChannelId').setLabel('Sugestões').setEmoji('💡').setStyle(ButtonStyle.Secondary),
    );
    return i.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
  }

  if (action === 'cargos') {
    const embed = baseEmbed(COLORS.INFO).setTitle('👥 Configurar Cargos').setDescription('Clique para definir cada cargo (você informará o ID):');
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('config:set:adminRoleId').setLabel('Admin').setEmoji('👑').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:set:modRoleId').setLabel('Moderador').setEmoji('🛡️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:set:memberRoleId').setLabel('Membro').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:set:mutedRoleId').setLabel('Mutado').setEmoji('🔇').setStyle(ButtonStyle.Secondary),
    );
    return i.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (action === 'set') {
    const [field] = extra;
    const labels: Record<string, string> = {
      logChannelId: 'Canal de Log', welcomeChannelId: 'Canal Boas-vindas',
      announcementChannelId: 'Canal Anúncios', levelUpChannelId: 'Canal Level-Up',
      ticketCategoryId: 'Categoria Tickets', ticketLogChannelId: 'Log de Tickets',
      suggestionChannelId: 'Canal Sugestões', feedbackChannelId: 'Canal Feedback',
      adminRoleId: 'Cargo Admin', modRoleId: 'Cargo Moderador',
      memberRoleId: 'Cargo Membro', mutedRoleId: 'Cargo Mutado',
    };
    const modal = new ModalBuilder().setCustomId(`modal:config:${field}`).setTitle(`⚙️ ${labels[field] ?? field}`);
    const inp = new TextInputBuilder().setCustomId('value').setLabel(`ID do ${labels[field] ?? field}`).setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Cole o ID aqui (ou "none" para remover)');
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(inp));
    return i.showModal(modal);
  }
}

// ─── MOD ──────────────────────────────────────────────────────────────────────

async function modButtons(i: ButtonInteraction, action: string) {
  if (!(await checkModerator(i))) return;

  const defs: Record<string, { title: string; fields: { id: string; label: string; required: boolean; placeholder?: string }[] }> = {
    ban: { title: '🔨 Banir', fields: [{ id: 'usuario', label: 'ID do usuário', required: true }, { id: 'motivo', label: 'Motivo', required: true }, { id: 'dias', label: 'Dias de mensagens p/ deletar (0-7)', required: false, placeholder: '0' }] },
    kick: { title: '🥾 Expulsar', fields: [{ id: 'usuario', label: 'ID do usuário', required: true }, { id: 'motivo', label: 'Motivo', required: true }] },
    mute: { title: '🔇 Mutar', fields: [{ id: 'usuario', label: 'ID do usuário', required: true }, { id: 'duracao', label: 'Duração (ex: 1h, 30m, 1d)', required: true }, { id: 'motivo', label: 'Motivo', required: true }] },
    unmute: { title: '🔊 Desmutar', fields: [{ id: 'usuario', label: 'ID do usuário', required: true }] },
    warn: { title: '⚠️ Advertir', fields: [{ id: 'usuario', label: 'ID do usuário', required: true }, { id: 'motivo', label: 'Motivo', required: true }] },
    warns: { title: '📋 Ver Avisos', fields: [{ id: 'usuario', label: 'ID do usuário', required: true }] },
  };

  const def = defs[action];
  if (!def) return;

  const modal = new ModalBuilder().setCustomId(`modal:${action}`).setTitle(def.title);
  for (const f of def.fields) {
    const inp = new TextInputBuilder().setCustomId(f.id).setLabel(f.label).setStyle(TextInputStyle.Short).setRequired(f.required);
    if (f.placeholder) inp.setPlaceholder(f.placeholder);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(inp));
  }
  await i.showModal(modal);
}

// ─── POLL VOTE ────────────────────────────────────────────────────────────────

async function pollVote(i: ButtonInteraction, extra: string[]) {
  const [pollId, idxStr] = extra;
  const idx = parseInt(idxStr);
  await i.deferReply({ ephemeral: true });

  const poll = await prisma.poll.findUnique({ where: { id: pollId }, include: { options: true } });
  if (!poll || poll.ended) return i.editReply({ embeds: [errorEmbed('Encerrada', 'Esta poll não existe ou já foi encerrada.')] });

  const option = poll.options[idx];
  if (!option) return i.editReply({ embeds: [errorEmbed('Erro', 'Opção inválida.')] });

  if (poll.options.some(o => o.voters.includes(i.user.id)))
    return i.editReply({ embeds: [errorEmbed('Já Votou', 'Você já votou nesta poll.')] });

  await prisma.pollOption.update({ where: { id: option.id }, data: { votes: { increment: 1 }, voters: { push: i.user.id } } });

  // Refresh embed
  const updated = await prisma.poll.findUnique({ where: { id: pollId }, include: { options: true } });
  if (updated?.messageId && updated.channelId) {
    try {
      const ch = i.guild?.channels.cache.get(updated.channelId) as TextChannel | undefined;
      if (ch) {
        const msg = await ch.messages.fetch(updated.messageId);
        const total = updated.options.reduce((a, o) => a + o.votes, 0);
        const emojis = ['🅰️', '🅱️', '🆑', '🆔'];
        const desc = updated.options.map((o, oi) => {
          const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
          const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
          return `${emojis[oi]} **${o.label}**\n\`${bar}\` ${pct}% (${o.votes} voto${o.votes !== 1 ? 's' : ''})`;
        }).join('\n\n');
        await msg.edit({ embeds: [baseEmbed().setTitle(`📊 ${updated.question}`).setDescription(desc).setFooter({ text: `${total} voto${total !== 1 ? 's' : ''} • ⚔️ Aliança Skyline` })] });
      }
    } catch { /* ignore */ }
  }

  await i.editReply({ embeds: [successEmbed('Voto Registrado!', `Você votou em **${option.label}**`)] });
}

// ─── GIVEAWAY JOIN ───────────────────────────────────────────────────────────

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

  // Update message footer
  try {
    const ch = i.guild?.channels.cache.get(giveaway.channelId) as TextChannel | undefined;
    if (ch && giveaway.messageId) {
      const msg = await ch.messages.fetch(giveaway.messageId);
      if (msg.embeds[0]) await msg.edit({ embeds: [EmbedBuilder.from(msg.embeds[0]).setFooter({ text: `${count} participante${count !== 1 ? 's' : ''} • ⚔️ Aliança Skyline` })] });
    }
  } catch { /* ignore */ }

  await i.editReply({ embeds: [successEmbed('Inscrito!', `Você entrou no sorteio de **${giveaway.prize}**! 🎉`)] });
}

// ─── EVENT JOIN ──────────────────────────────────────────────────────────────

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
