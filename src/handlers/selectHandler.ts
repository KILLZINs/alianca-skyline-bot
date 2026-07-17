import {
  StringSelectMenuInteraction, TextChannel, ChannelType,
  PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { prisma } from '../database/client';
import { getConfig } from '../utils/helpers';
import { COLORS, EMOJIS, baseEmbed, successEmbed, errorEmbed } from '../utils/embeds';

export async function handleSelect(interaction: StringSelectMenuInteraction) {
  const [prefix, action] = interaction.customId.split(':');
  try {
    if (prefix === 'ticket' && action === 'category') return await ticketCategory(interaction);
  } catch (err) {
    console.error('Select error:', err);
    const e = errorEmbed('Erro', 'Ocorreu um erro ao processar esta ação.');
    if (interaction.replied || interaction.deferred) await interaction.followUp({ embeds: [e], ephemeral: true });
    else await interaction.reply({ embeds: [e], ephemeral: true });
  }
}

async function ticketCategory(i: StringSelectMenuInteraction) {
  await i.deferReply({ ephemeral: true });

  const category = i.values[0];
  const guild = i.guild!;
  const user = i.user;

  const existing = await prisma.ticket.findFirst({ where: { authorId: user.id, status: 'open' } });
  if (existing) {
    const ch = guild.channels.cache.get(existing.channelId);
    if (ch) return i.editReply({ embeds: [errorEmbed('Ticket Existente', `Você já tem um ticket aberto: ${ch}`)] });
    await prisma.ticket.delete({ where: { id: existing.id } });
  }

  const config = await getConfig(guild.id);

  const labels: Record<string, string> = {
    suporte: '🛠️ Suporte Geral', parceria: '🤝 Parceria',
    reporte: '🚨 Reporte', candidatura: '📋 Candidatura', outro: '❓ Outro',
  };

  const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}-${category}`;

  const ticketCh = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId ?? undefined,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      ...(config.modRoleId ? [{ id: config.modRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }] : []),
      ...(config.adminRoleId ? [{ id: config.adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] }] : []),
    ],
  });

  const ticket = await prisma.ticket.create({ data: { channelId: ticketCh.id, authorId: user.id, category } });

  const embed = baseEmbed()
    .setTitle(`${EMOJIS.TICKET} ${labels[category] ?? category}`)
    .setDescription(`Olá ${user}! Descreva seu problema e aguarde um moderador.\n\n**Categoria:** ${labels[category] ?? category}`)
    .addFields(
      { name: '📌 Autor', value: `${user} (${user.id})`, inline: true },
      { name: '🏷️ Categoria', value: labels[category] ?? category, inline: true },
    )
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`ticket:close:${ticket.id}`).setLabel('Fechar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ticket:claim:${ticket.id}`).setLabel('Assumir Ticket').setEmoji('🛡️').setStyle(ButtonStyle.Primary),
  );

  const ping = config.modRoleId ? `<@&${config.modRoleId}>` : '';
  await ticketCh.send({ content: `${user} ${ping}`.trim(), embeds: [embed], components: [row] });

  if (config.ticketLogChannelId) {
    const logCh = guild.channels.cache.get(config.ticketLogChannelId) as TextChannel | undefined;
    if (logCh) {
      await logCh.send({ embeds: [baseEmbed(COLORS.INFO).setTitle('🎫 Novo Ticket').addFields({ name: 'Autor', value: `${user} (${user.id})`, inline: true }, { name: 'Categoria', value: labels[category] ?? category, inline: true }, { name: 'Canal', value: `${ticketCh}`, inline: true })] });
    }
  }

  await i.editReply({ embeds: [successEmbed('Ticket Criado!', `Seu ticket foi aberto em ${ticketCh}`)] });
}
