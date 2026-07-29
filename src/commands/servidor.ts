import {
  SlashCommandBuilder, ChatInputCommandInteraction,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { Command } from '../types';
import { errorEmbed } from '../utils/embeds';
import { prisma } from '../database/client';
import { getServerClass, getNextClass, getAlliancePanelEmoji, isAllianceServerRepresentative } from '../utils/alliance';

const SKYLINE_PURPLE = 0x470F78;

const PANEL_EMOJIS = {
  title: '💀',
  currentClass: '🕸️',
  members: '🦴',
  channel: '⚓',
  invite: '🔗',
  nextClass: '🌪️',
  maxClass: '🎱',
  footer: '🖤',
  buttons: {
    channel: '⚓',
    invite: '🔗',
    stats: '🎚️',
    network: '☁️',
    performance: '⚙️',
  },
} as const;

function panelClassEmoji(className: string): string {
  return getAlliancePanelEmoji(className);
}

export default {
  category: 'alianca',
  data: new SlashCommandBuilder()
    .setName('servidor')
    .setDescription('Painel do servidor na Aliança Skyline (donos e cargos autorizados)'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) {
      return interaction.reply({ embeds: [errorEmbed('Erro', 'Use em um servidor.')], ephemeral: true });
    }

    const guildId  = interaction.guild.id;
    const isOwner  = interaction.guild.ownerId === interaction.user.id;

    const allianceServer = await prisma.allianceServer.findUnique({ where: { guildId } });
    const isRepresentative = await isAllianceServerRepresentative(guildId, interaction.user.id);

    if (!isOwner && !isRepresentative) {
      return interaction.reply({
        embeds: [errorEmbed('Sem Permissão', 'Apenas o dono do servidor ou representantes definidos em `/alianca` podem usar este painel.')],
        ephemeral: true,
      });
    }

    if (!allianceServer) {
      return interaction.reply({
        embeds: [errorEmbed('Servidor não cadastrado', 'Este servidor não está cadastrado na Aliança Skyline.\nPeça a um admin da aliança para adicioná-lo com `/alianca`.')],
        ephemeral: true,
      });
    }

    const cls  = getServerClass(allianceServer.memberCount ?? interaction.guild.memberCount);
    const next = getNextClass(allianceServer.memberCount ?? interaction.guild.memberCount);
    const clsEmoji = panelClassEmoji(cls.name);
    const nextEmoji = next ? panelClassEmoji(next.cls.name) : null;

    const embed = new EmbedBuilder()
      .setColor(SKYLINE_PURPLE)
      .setTitle(`${PANEL_EMOJIS.title} ${interaction.guild.name} — Painel do Servidor`)
      .setThumbnail(interaction.guild.iconURL() ?? null)
      .addFields(
        { name: `${PANEL_EMOJIS.currentClass} Classe Atual`,   value: `${clsEmoji} **${cls.name}**`,                                                                          inline: true },
        { name: `${PANEL_EMOJIS.members} Membros`,         value: `**${(allianceServer.memberCount ?? interaction.guild.memberCount).toLocaleString('pt-BR')}**`,            inline: true },
        { name: `${PANEL_EMOJIS.channel} Canal Aliança`,   value: allianceServer.channelId  ? `<#${allianceServer.channelId}>`                          : '*Não configurado*', inline: true },
        { name: `${PANEL_EMOJIS.invite} Link de Convite`, value: allianceServer.inviteLink ? `[Clique aqui](${allianceServer.inviteLink})`             : '*Não configurado*', inline: true },
        {
          name:  next ? `${PANEL_EMOJIS.nextClass} Próxima Classe: ${nextEmoji} ${next.cls.name}` : `${PANEL_EMOJIS.maxClass} Classe Máxima`,
          value: next ? `Faltam **${next.needed.toLocaleString('pt-BR')}** membros` : 'Você está no topo da aliança!',
          inline: false,
        },
      )
      .setFooter({ text: `${PANEL_EMOJIS.footer} Aliança Skyline` })
      .setTimestamp();

    // Linha 1 — configurações do servidor na aliança
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('servidor:set_channel')  .setLabel('Canal Aliança') .setEmoji(PANEL_EMOJIS.buttons.channel).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('servidor:set_invite')   .setLabel('Link Convite')  .setEmoji(PANEL_EMOJIS.buttons.invite).setStyle(ButtonStyle.Secondary),
    );

    // Linha 2 — visualizações (movidas do /painel)
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('servidor:stats_server').setLabel('Estatísticas').setEmoji(PANEL_EMOJIS.buttons.stats).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('servidor:rede')        .setLabel('Rede Aliança').setEmoji(PANEL_EMOJIS.buttons.network).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('servidor:performance') .setLabel('Desempenho')  .setEmoji(PANEL_EMOJIS.buttons.performance).setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
  },
} satisfies Command;
