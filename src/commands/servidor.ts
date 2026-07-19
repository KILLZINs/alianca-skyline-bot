import {
  SlashCommandBuilder, ChatInputCommandInteraction,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember,
} from 'discord.js';
import { Command } from '../types';
import { COLORS, EMOJIS, errorEmbed, baseEmbed } from '../utils/embeds';
import { prisma } from '../database/client';
import { isAllianceServer, getServerClass, getNextClass } from '../utils/alliance';

export default {
  category: 'alianca',
  data: new SlashCommandBuilder()
    .setName('servidor')
    .setDescription('Painel do servidor na Aliança Skyline (donos do servidor)'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) {
      return interaction.reply({ embeds: [errorEmbed('Erro', 'Use em um servidor.')], ephemeral: true });
    }

    const member = interaction.member as GuildMember;
    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const isManager = member.permissions.has('ManageGuild');

    if (!isOwner && !isManager) {
      return interaction.reply({
        embeds: [errorEmbed('Sem Permissão', 'Apenas donos ou gerentes do servidor podem usar este painel.')],
        ephemeral: true,
      });
    }

    const guildId = interaction.guild.id;
    const inAlliance = await isAllianceServer(guildId);

    if (!inAlliance) {
      return interaction.reply({
        embeds: [errorEmbed('Servidor não cadastrado', 'Este servidor não está cadastrado na Aliança Skyline.\nPeça a um admin da aliança para adicioná-lo com `/alianca`.')],
        ephemeral: true,
      });
    }

    const allianceServer = await prisma.allianceServer.findUnique({ where: { guildId } });
    const cls = getServerClass(allianceServer?.memberCount ?? interaction.guild.memberCount);
    const next = getNextClass(allianceServer?.memberCount ?? interaction.guild.memberCount);

    const embed = new EmbedBuilder()
      .setColor(cls.color)
      .setTitle(`${cls.emoji} ${interaction.guild.name} — Painel do Servidor`)
      .setThumbnail(interaction.guild.iconURL() ?? null)
      .addFields(
        { name: '🏷️ Classe Atual',  value: `${cls.emoji} **${cls.name}**`,                                                   inline: true },
        { name: '👥 Membros',        value: `**${(allianceServer?.memberCount ?? interaction.guild.memberCount).toLocaleString('pt-BR')}**`, inline: true },
        { name: '📌 Canal Aliança',  value: allianceServer?.channelId ? `<#${allianceServer.channelId}>` : '*Não configurado*', inline: true },
        { name: '🔗 Link de Convite',value: allianceServer?.inviteLink ? `[Clique aqui](${allianceServer.inviteLink})` : '*Não configurado*', inline: true },
        {
          name:  next ? `📈 Próxima Classe: ${next.cls.emoji} ${next.cls.name}` : '🏆 Classe Máxima',
          value: next ? `Faltam **${next.needed.toLocaleString('pt-BR')}** membros` : 'Você está no topo da aliança!',
          inline: false,
        },
      )
      .setFooter({ text: '⚔️ Aliança Skyline' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('servidor:set_channel') .setLabel('Definir Canal Aliança').setEmoji('📌').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('servidor:set_invite')  .setLabel('Definir Link Convite') .setEmoji('🔗').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('servidor:performance') .setLabel('Desempenho')           .setEmoji('📊').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
} satisfies Command;
