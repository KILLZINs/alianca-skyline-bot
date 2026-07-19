import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../types';
import { COLORS, EMOJIS } from '../utils/embeds';

export default {
  category: 'geral',
  data: new SlashCommandBuilder().setName('painel').setDescription('Painel principal da Aliança Skyline'),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('⚔️ Aliança Skyline — Painel Principal')
      .setDescription('Bem-vindo ao painel central! Selecione uma opção abaixo.')
      .setThumbnail(interaction.guild?.iconURL() ?? null)
      .addFields(
        { name: `${EMOJIS.PERSON} Perfil`,      value: 'Perfil completo, XP, moedas',   inline: true },
        { name: `${EMOJIS.LEVEL} Nível`,         value: 'Progresso e próxima recompensa', inline: true },
        { name: `${EMOJIS.TROPHY} Ranking`,       value: 'Top XP e top ricos',            inline: true },
        { name: `${EMOJIS.TROPHY} Conquistas`,    value: 'Suas conquistas desbloqueadas', inline: true },
        { name: `${EMOJIS.COINS} Economia`,       value: 'Saldo e transferências',        inline: true },
        { name: `⭐ Loja`,                        value: 'Comprar itens com moedas',       inline: true },
        { name: `${EMOJIS.FIRE} Missões`,         value: 'Missões diárias + resgatar',    inline: true },
        { name: `${EMOJIS.CHART} Servidor`,       value: 'Stats do servidor de hoje',     inline: true },
        { name: `🌐 Rede`,                        value: 'Stats de toda a aliança',        inline: true },
        { name: `${EMOJIS.TICKET} Suporte`,       value: 'Ticket, sugestão, feedback',    inline: true },
        { name: `${EMOJIS.GIFT} Sorteios`,        value: 'Sorteios ativos',               inline: true },
        { name: `${EMOJIS.PIN} Eventos`,          value: 'Eventos ativos',                inline: true },
      )
      .setTimestamp()
      .setFooter({ text: '⚔️ Aliança Skyline • /genero para personalizar pronomes • /rp para roleplay' });

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('painel:perfil').setLabel('Perfil').setEmoji('👤').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel:nivel').setLabel('Nível').setEmoji('🎯').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel:ranking').setLabel('Ranking').setEmoji('🏆').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel:conquistas').setLabel('Conquistas').setEmoji('🏅').setStyle(ButtonStyle.Secondary),
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('painel:economia').setLabel('Economia').setEmoji('🪙').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel:loja').setLabel('Loja').setEmoji('🛍️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel:missoes').setLabel('Missões').setEmoji('🔥').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel:servidor').setLabel('Servidor').setEmoji('📊').setStyle(ButtonStyle.Primary),
    );
    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('painel:rede').setLabel('Rede').setEmoji('🌐').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('painel:ticket').setLabel('Suporte').setEmoji('🎫').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('painel:sorteios').setLabel('Sorteios').setEmoji('🎁').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('painel:eventos').setLabel('Eventos').setEmoji('📌').setStyle(ButtonStyle.Success),
    );

    const row4 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('rpg:perfil').setLabel('RPG').setEmoji('⚔️').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4] });
  },
} satisfies Command;
