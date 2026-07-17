import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../types';
import { COLORS, EMOJIS } from '../utils/embeds';
import { checkAdmin } from '../utils/permissions';

export default {
  category: 'admin',
  data: new SlashCommandBuilder().setName('admin').setDescription('Painel de administração da Aliança Skyline'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await checkAdmin(interaction))) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS.DARK)
      .setTitle(`${EMOJIS.CROWN} Painel de Administração`)
      .setDescription('Bem-vindo ao painel de administração! Selecione uma ação abaixo.')
      .setTimestamp()
      .setFooter({ text: '⚔️ Aliança Skyline — Admin' });

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('admin:config').setLabel('Configurações').setEmoji('⚙️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('admin:mod').setLabel('Moderação').setEmoji('🔨').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('admin:anuncio').setLabel('Anúncio').setEmoji('📢').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('admin:poll').setLabel('Poll').setEmoji('📊').setStyle(ButtonStyle.Primary),
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('admin:evento').setLabel('Criar Evento').setEmoji('🎉').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('admin:sorteio').setLabel('Criar Sorteio').setEmoji('🎁').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('admin:rank').setLabel('Definir Rank').setEmoji('👑').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
  },
} satisfies Command;
