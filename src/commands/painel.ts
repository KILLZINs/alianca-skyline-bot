import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../types';
import { COLORS, EMOJIS } from '../utils/embeds';

export default {
  category: 'geral',
  data: new SlashCommandBuilder().setName('painel').setDescription('Abre o painel principal da Aliança Skyline'),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('⚔️ Aliança Skyline — Painel Principal')
      .setDescription('Bem-vindo ao painel central! Selecione uma opção abaixo para começar.')
      .setThumbnail(interaction.guild?.iconURL() ?? null)
      .setTimestamp()
      .setFooter({ text: '⚔️ Aliança Skyline' });

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('painel:perfil').setLabel('Perfil').setEmoji('👤').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel:nivel').setLabel('Nível').setEmoji('🎯').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel:ranking').setLabel('Ranking').setEmoji('🏆').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel:info').setLabel('Servidor').setEmoji('📊').setStyle(ButtonStyle.Secondary),
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('painel:ticket').setLabel('Ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel:sorteios').setLabel('Sorteios').setEmoji('🎁').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel:eventos').setLabel('Eventos').setEmoji('📌').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel:ajuda').setLabel('Ajuda').setEmoji('❓').setStyle(ButtonStyle.Primary),
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2] });
  },
} satisfies Command;
