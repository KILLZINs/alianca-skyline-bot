import {
  ModalSubmitInteraction, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
} from 'discord.js';
import { prisma } from '../database/client';
import { getConfig, parseDuration } from '../utils/helpers';
import { COLORS, EMOJIS, baseEmbed, successEmbed, errorEmbed, rankEmoji } from '../utils/embeds';
import { checkAdmin, checkModerator } from '../utils/permissions';
import { RANKS } from '../types';

function resolveId(s: string) { return s.replace(/[<@!>&]/g, '').trim(); }

export async function handleModal(i: ModalSubmitInteraction) {
  const parts = i.customId.split(':');
  const action = parts[1];
  const extra = parts.slice(2);
  try {
    switch (action) {
      case 'ban':     return await modBan(i);
      case 'kick':    return await modKick(i);
      case 'mute':    return await modMute(i);
      case 'unmute':  return await modUnmute(i);
      case 'warn':    return await modWarn(i);
      case 'warns':   return await modWarns(i);
      case 'anuncio': return await sendAnuncio(i);
      case 'config':  return await updateConfig(i, extra[0]);
      case 'poll':    return await createPoll(i);
      case 'evento':  return await createEvento(i);
      case 'sorteio': return await createSorteio(i);
      case 'rank':            return await setRank(i);
      case 'feedbacksubmit':  return await sendFeedbackMsg(i);
      case 'sugestaosubmit':  return await sendSugestaoMsg(i);
    }
  } catch (err) {
    console.error('Modal error:', err);
    const e = errorEmbed('Erro', 'Ocorreu um erro ao processar este formulário.');
    try {
      if (i.replied || i.deferred) await i.followUp({ embeds: [e], ephemeral: true });
      else await i.reply({ embeds: [e], ephemeral: true });
    } catch { /* ignore */ }
  }
}

// ─── MODERATION ───────────────────────────────────────────────────────────────

async function modBan(i: ModalSubmitInteraction) {
  if (!(await checkModerator(i))) return;
  await i.deferReply({ ephemeral: true });
  const userId = resolveId(i.fields.getTextInputValue('usuario'));
  const motivo = i.fields.getTextInputValue('motivo');
  const dias = Math.min(7, Math.max(0, parseInt(i.fields.getTextInputValue('dias') || '0') || 0));
  const guild = i.guild!;
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Usuário não encontrado no servidor.')] });
    await guild.bans.create(userId, { reason: `${i.user.tag}: ${motivo}`, deleteMessageSeconds: dias * 86400 });
    const config = await getConfig(guild.id);
    await sendLog(guild, config.logChannelId, baseEmbed(COLORS.ERROR).setTitle(`${EMOJIS.HAMMER} Membro Banido`).addFields({ name: 'Usuário', value: `${member.user.tag} (${userId})`, inline: true }, { name: 'Moderador', value: i.user.tag, inline: true }, { name: 'Motivo', value: motivo }));
    await i.editReply({ embeds: [successEmbed('Banido!', `**${member.user.tag}** foi banido.\nMotivo: ${motivo}`)] });
  } catch (err) {
    await i.editReply({ embeds: [errorEmbed('Erro', `Não foi possível banir: ${err}`)] });
  }
}

async function modKick(i: ModalSubmitInteraction) {
  if (!(await checkModerator(i))) return;
  await i.deferReply({ ephemeral: true });
  const userId = resolveId(i.fields.getTextInputValue('usuario'));
  const motivo = i.fields.getTextInputValue('motivo');
  const guild = i.guild!;
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Usuário não encontrado no servidor.')] });
    await member.kick(`${i.user.tag}: ${motivo}`);
    const config = await getConfig(guild.id);
    await sendLog(guild, config.logChannelId, baseEmbed(COLORS.WARNING).setTitle('🥾 Membro Expulso').addFields({ name: 'Usuário', value: `${member.user.tag} (${userId})`, inline: true }, { name: 'Moderador', value: i.user.tag, inline: true }, { name: 'Motivo', value: motivo }));
    await i.editReply({ embeds: [successEmbed('Expulso!', `**${member.user.tag}** foi expulso.\nMotivo: ${motivo}`)] });
  } catch (err) {
    await i.editReply({ embeds: [errorEmbed('Erro', `Não foi possível expulsar: ${err}`)] });
  }
}

async function modMute(i: ModalSubmitInteraction) {
  if (!(await checkModerator(i))) return;
  await i.deferReply({ ephemeral: true });
  const userId = resolveId(i.fields.getTextInputValue('usuario'));
  const duracaoStr = i.fields.getTextInputValue('duracao');
  const motivo = i.fields.getTextInputValue('motivo');
  const ms = parseDuration(duracaoStr);
  if (!ms) return i.editReply({ embeds: [errorEmbed('Duração Inválida', 'Use formatos como `1h`, `30m`, `1d`.')] });
  const guild = i.guild!;
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Usuário não encontrado no servidor.')] });
    await member.timeout(ms, `${i.user.tag}: ${motivo}`);
    const config = await getConfig(guild.id);
    await sendLog(guild, config.logChannelId, baseEmbed(COLORS.INFO).setTitle('🔇 Membro Mutado').addFields({ name: 'Usuário', value: `${member.user.tag}`, inline: true }, { name: 'Duração', value: duracaoStr, inline: true }, { name: 'Moderador', value: i.user.tag, inline: true }, { name: 'Motivo', value: motivo }));
    await i.editReply({ embeds: [successEmbed('Mutado!', `**${member.user.tag}** foi mutado por ${duracaoStr}.\nMotivo: ${motivo}`)] });
  } catch (err) {
    await i.editReply({ embeds: [errorEmbed('Erro', `Não foi possível mutar: ${err}`)] });
  }
}

async function modUnmute(i: ModalSubmitInteraction) {
  if (!(await checkModerator(i))) return;
  await i.deferReply({ ephemeral: true });
  const userId = resolveId(i.fields.getTextInputValue('usuario'));
  const guild = i.guild!;
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Usuário não encontrado no servidor.')] });
    await member.timeout(null);
    await i.editReply({ embeds: [successEmbed('Desmutado!', `**${member.user.tag}** foi desmutado.`)] });
  } catch (err) {
    await i.editReply({ embeds: [errorEmbed('Erro', `Não foi possível desmutar: ${err}`)] });
  }
}

async function modWarn(i: ModalSubmitInteraction) {
  if (!(await checkModerator(i))) return;
  await i.deferReply({ ephemeral: true });
  const userId = resolveId(i.fields.getTextInputValue('usuario'));
  const motivo = i.fields.getTextInputValue('motivo');
  const guild = i.guild!;
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Usuário não encontrado no servidor.')] });
    await prisma.warn.create({ data: { memberId: userId, moderator: i.user.id, reason: motivo, guildId: guild.id } });
    await prisma.member.upsert({ where: { discordId: userId }, update: { warnings: { increment: 1 } }, create: { discordId: userId, username: member.user.username, warnings: 1 } });
    const totalWarns = await prisma.warn.count({ where: { memberId: userId, guildId: guild.id } });
    const config = await getConfig(guild.id);
    await sendLog(guild, config.logChannelId, baseEmbed(COLORS.WARNING).setTitle('⚠️ Membro Advertido').addFields({ name: 'Usuário', value: `${member.user.tag} (${userId})`, inline: true }, { name: 'Moderador', value: i.user.tag, inline: true }, { name: 'Total de avisos', value: `${totalWarns}`, inline: true }, { name: 'Motivo', value: motivo }));
    await i.editReply({ embeds: [successEmbed('Advertido!', `**${member.user.tag}** foi advertido (total: ${totalWarns} aviso${totalWarns !== 1 ? 's' : ''}).\nMotivo: ${motivo}`)] });
  } catch (err) {
    await i.editReply({ embeds: [errorEmbed('Erro', `Não foi possível advertir: ${err}`)] });
  }
}

async function modWarns(i: ModalSubmitInteraction) {
  if (!(await checkModerator(i))) return;
  await i.deferReply({ ephemeral: true });
  const userId = resolveId(i.fields.getTextInputValue('usuario'));
  const guild = i.guild!;
  const member = await guild.members.fetch(userId).catch(() => null);
  const warns = await prisma.warn.findMany({ where: { memberId: userId, guildId: guild.id }, orderBy: { createdAt: 'desc' }, take: 10 });
  if (!warns.length) return i.editReply({ embeds: [baseEmbed().setTitle('📋 Avisos').setDescription(`${member?.user.tag ?? userId} não tem avisos.`)] });
  const list = warns.map((w, idx) => `**${idx + 1}.** ${w.reason} — <@${w.moderator}> — <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`).join('\n');
  await i.editReply({ embeds: [baseEmbed(COLORS.WARNING).setTitle(`⚠️ Avisos de ${member?.user.tag ?? userId}`).setDescription(list)] });
}

// ─── ANUNCIO ──────────────────────────────────────────────────────────────────

async function sendAnuncio(i: ModalSubmitInteraction) {
  if (!(await checkAdmin(i))) return;
  await i.deferReply({ ephemeral: true });
  const titulo = i.fields.getTextInputValue('titulo');
  const mensagem = i.fields.getTextInputValue('mensagem');
  const config = await getConfig(i.guild!.id);
  const channelId = config.announcementChannelId;
  if (!channelId) return i.editReply({ embeds: [errorEmbed('Canal não configurado', 'Configure o canal de anúncios em `/config`.')] });
  const channel = i.guild!.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return i.editReply({ embeds: [errorEmbed('Canal não encontrado', 'O canal de anúncios configurado não existe.')] });
  const embed = baseEmbed(COLORS.PRIMARY).setTitle(`${EMOJIS.MEGAPHONE} ${titulo}`).setDescription(mensagem).setFooter({ text: `Anúncio por ${i.user.tag} • ⚔️ Aliança Skyline` });
  await channel.send({ embeds: [embed] });
  await i.editReply({ embeds: [successEmbed('Anúncio Enviado!', `Anúncio publicado em ${channel}`)] });
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

async function updateConfig(i: ModalSubmitInteraction, field: string) {
  if (!(await checkAdmin(i))) return;
  await i.deferReply({ ephemeral: true });
  const value = i.fields.getTextInputValue('value').trim();
  const resolvedValue = value.toLowerCase() === 'none' ? null : value;
  await prisma.guildConfig.upsert({
    where: { guildId: i.guild!.id },
    update: { [field]: resolvedValue },
    create: { guildId: i.guild!.id, [field]: resolvedValue },
  });
  const label = field.replace(/Id$/, '').replace(/([A-Z])/g, ' $1').toLowerCase();
  await i.editReply({ embeds: [successEmbed('Config Atualizada!', `**${label}** foi ${resolvedValue ? `definido como \`${resolvedValue}\`` : 'removido'}.`)] });
}

// ─── POLL ─────────────────────────────────────────────────────────────────────

async function createPoll(i: ModalSubmitInteraction) {
  if (!(await checkAdmin(i))) return;
  await i.deferReply({ ephemeral: true });
  const pergunta = i.fields.getTextInputValue('pergunta');
  const opcoes = [
    i.fields.getTextInputValue('opcao1'),
    i.fields.getTextInputValue('opcao2'),
    i.fields.getTextInputValue('opcao3').trim() || null,
    i.fields.getTextInputValue('opcao4').trim() || null,
  ].filter((o): o is string => !!o);

  const guild = i.guild!;
  const channel = i.channel as TextChannel;

  const poll = await prisma.poll.create({
    data: { guildId: guild.id, channelId: channel.id, question: pergunta, createdBy: i.user.id, options: { create: opcoes.map(label => ({ label, votes: 0 })) } },
    include: { options: true },
  });

  const emojis = ['🅰️', '🅱️', '🆑', '🆔'];
  const desc = poll.options.map((o, idx) => `${emojis[idx]} **${o.label}**\n\`░░░░░░░░░░\` 0%`).join('\n\n');
  const embed = baseEmbed().setTitle(`📊 ${pergunta}`).setDescription(desc).setFooter({ text: '0 votos • ⚔️ Aliança Skyline' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    poll.options.map((o, idx) =>
      new ButtonBuilder().setCustomId(`poll:vote:${poll.id}:${idx}`).setLabel(o.label).setEmoji(emojis[idx]).setStyle(ButtonStyle.Primary)
    )
  );

  const msg = await channel.send({ embeds: [embed], components: [row] });
  await prisma.poll.update({ where: { id: poll.id }, data: { messageId: msg.id } });
  await i.editReply({ embeds: [successEmbed('Poll Criada!', `Poll publicada em ${channel}`)] });
}

// ─── EVENTO ───────────────────────────────────────────────────────────────────

async function createEvento(i: ModalSubmitInteraction) {
  if (!(await checkAdmin(i))) return;
  await i.deferReply({ ephemeral: true });
  const titulo = i.fields.getTextInputValue('titulo');
  const descricao = i.fields.getTextInputValue('descricao');
  const dataStr = i.fields.getTextInputValue('data');
  const ms = parseDuration(dataStr);
  if (!ms) return i.editReply({ embeds: [errorEmbed('Data inválida', 'Use formatos como `2h`, `1d`, `30m`.')] });
  const startsAt = new Date(Date.now() + ms);

  const guild = i.guild!;
  const channel = i.channel as TextChannel;

  const event = await prisma.event.create({
    data: { guildId: guild.id, channelId: channel.id, title: titulo, description: descricao, hostId: i.user.id, startsAt },
  });

  const embed = baseEmbed(COLORS.SECONDARY)
    .setTitle(`${EMOJIS.BELL} ${titulo}`)
    .setDescription(descricao)
    .addFields(
      { name: '📅 Quando', value: `<t:${Math.floor(startsAt.getTime() / 1000)}:F> (<t:${Math.floor(startsAt.getTime() / 1000)}:R>)`, inline: false },
      { name: '👑 Organizador', value: `${i.user}`, inline: true },
      { name: '👥 Participantes', value: '**0**', inline: true },
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`event:join:${event.id}`).setLabel('Participar').setEmoji('✅').setStyle(ButtonStyle.Success),
  );

  const msg = await channel.send({ embeds: [embed], components: [row] });
  await prisma.event.update({ where: { id: event.id }, data: { messageId: msg.id } });
  await i.editReply({ embeds: [successEmbed('Evento Criado!', `Evento publicado em ${channel}`)] });
}

// ─── SORTEIO ──────────────────────────────────────────────────────────────────

async function createSorteio(i: ModalSubmitInteraction) {
  if (!(await checkAdmin(i))) return;
  await i.deferReply({ ephemeral: true });
  const premio = i.fields.getTextInputValue('premio');
  const vencedores = Math.max(1, parseInt(i.fields.getTextInputValue('vencedores') || '1') || 1);
  const duracaoStr = i.fields.getTextInputValue('duracao');
  const ms = parseDuration(duracaoStr);
  if (!ms) return i.editReply({ embeds: [errorEmbed('Duração inválida', 'Use formatos como `1h`, `2d`, `30m`.')] });
  const endsAt = new Date(Date.now() + ms);

  const guild = i.guild!;
  const channel = i.channel as TextChannel;

  const giveaway = await prisma.giveaway.create({
    data: { guildId: guild.id, channelId: channel.id, prize: premio, winners: vencedores, hostId: i.user.id, endsAt },
  });

  const embed = baseEmbed(COLORS.GOLD)
    .setTitle(`${EMOJIS.GIFT} Sorteio — ${premio}`)
    .addFields(
      { name: '🏆 Vencedores', value: `**${vencedores}**`, inline: true },
      { name: '⏰ Encerra', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true },
      { name: '👑 Criado por', value: `${i.user}`, inline: true },
    )
    .setFooter({ text: '0 participantes • ⚔️ Aliança Skyline' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`giveaway:join:${giveaway.id}`).setLabel('Participar').setEmoji('🎁').setStyle(ButtonStyle.Success),
  );

  const msg = await channel.send({ embeds: [embed], components: [row] });
  await prisma.giveaway.update({ where: { id: giveaway.id }, data: { messageId: msg.id } });
  await i.editReply({ embeds: [successEmbed('Sorteio Criado!', `Sorteio publicado em ${channel}`)] });
}

// ─── RANK SET ─────────────────────────────────────────────────────────────────

async function setRank(i: ModalSubmitInteraction) {
  if (!(await checkAdmin(i))) return;
  await i.deferReply({ ephemeral: true });
  const userId = resolveId(i.fields.getTextInputValue('usuario'));
  const newRank = i.fields.getTextInputValue('rank').trim();

  if (!(RANKS as readonly string[]).includes(newRank)) {
    return i.editReply({ embeds: [errorEmbed('Rank inválido', `Ranks válidos: ${RANKS.join(', ')}`)] });
  }

  const guild = i.guild!;
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return i.editReply({ embeds: [errorEmbed('Não encontrado', 'Usuário não encontrado.')] });

  await prisma.member.upsert({ where: { discordId: userId }, update: { rank: newRank }, create: { discordId: userId, username: member.user.username, rank: newRank } });
  await i.editReply({ embeds: [successEmbed('Rank Atualizado!', `${member} agora é ${rankEmoji(newRank)} **${newRank}**!`)] });
}

// ─── FEEDBACK / SUGESTÃO ─────────────────────────────────────────────────────

async function sendFeedbackMsg(i: ModalSubmitInteraction) {
  await i.deferReply({ ephemeral: true });
  const assunto = i.fields.getTextInputValue('assunto');
  const mensagem = i.fields.getTextInputValue('mensagem');
  const config = await getConfig(i.guild!.id);
  const channelId = config.feedbackChannelId ?? config.logChannelId;
  if (!channelId) return i.editReply({ embeds: [errorEmbed('Canal não configurado', 'Configure o canal de feedback via `/config`.')] });
  const channel = i.guild!.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return i.editReply({ embeds: [errorEmbed('Canal não encontrado', 'O canal de feedback não existe.')] });
  const embed = baseEmbed(COLORS.INFO)
    .setTitle(`💬 Feedback — ${assunto}`)
    .setDescription(mensagem)
    .setAuthor({ name: i.user.tag, iconURL: i.user.displayAvatarURL() })
    .setTimestamp();
  await channel.send({ embeds: [embed] });
  await i.editReply({ embeds: [successEmbed('Feedback Enviado!', 'Obrigado pelo seu feedback! A equipe irá analisá-lo.')] });
}

async function sendSugestaoMsg(i: ModalSubmitInteraction) {
  await i.deferReply({ ephemeral: true });
  const titulo = i.fields.getTextInputValue('titulo');
  const descricao = i.fields.getTextInputValue('descricao');
  const config = await getConfig(i.guild!.id);
  const channelId = config.suggestionChannelId ?? config.logChannelId;
  if (!channelId) return i.editReply({ embeds: [errorEmbed('Canal não configurado', 'Configure o canal de sugestões via `/config`.')] });
  const channel = i.guild!.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return i.editReply({ embeds: [errorEmbed('Canal não encontrado', 'O canal de sugestões não existe.')] });
  const embed = baseEmbed(COLORS.SUCCESS)
    .setTitle(`💡 ${titulo}`)
    .setDescription(descricao)
    .setAuthor({ name: i.user.tag, iconURL: i.user.displayAvatarURL() })
    .setTimestamp()
    .setFooter({ text: '⚔️ Aliança Skyline • Use os botões para votar' });
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('sugestao:upvote').setLabel('👍 Apoiar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('sugestao:downvote').setLabel('👎 Contra').setStyle(ButtonStyle.Danger),
  );
  await channel.send({ embeds: [embed], components: [row] });
  await i.editReply({ embeds: [successEmbed('Sugestão Enviada!', 'Sua sugestão foi enviada para votação!')] });
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

async function sendLog(guild: any, channelId: string | null | undefined, embed: EmbedBuilder) {
  if (!channelId) return;
  const ch = guild.channels.cache.get(channelId) as TextChannel | undefined;
  if (ch) await ch.send({ embeds: [embed] }).catch(() => null);
}
