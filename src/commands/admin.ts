import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../types';
import { COLORS, EMOJIS } from '../utils/embeds';
import { checkAdmin } from '../utils/permissions';
import { isBotManager } from '../utils/allowlist';

export default {
  category: 'admin',
  data: new SlashCommandBuilder().setName('admin').setDescription('Painel de administração da Aliança Skyline'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await checkAdmin(interaction))) return;

    const showAllowlist = isBotManager(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(COLORS.DARK)
      .setTitle(`${EMOJIS.CROWN} Painel de Administração`)
      .setDescription('Gerencie o servidor através dos painéis abaixo.')
      .addFields(
        { name: '⚙️ Configurações',      value: 'Canais, cargos, XP, boas-vindas',   inline: true },
        { name: '📢 Comunicação',         value: 'Anúncios, enquetes, eventos',        inline: true },
        { name: '🎁 Entretenimento',      value: 'Sorteios, conquistas, recompensas',  inline: true },
        { name: '🪙 Economia',            value: 'Dar/remover moedas e XP',           inline: true },
        { name: '🛍️ Loja',               value: 'Gerenciar itens da loja',            inline: true },
        { name: '🎯 Recompensas de Nível',value: 'Cargos automáticos por nível',      inline: true },
        { name: '📈 Estatísticas',        value: 'Stats detalhados do servidor',       inline: true },
        { name: '🔨 Moderação',           value: 'Ações de moderação rápida',          inline: true },
        ...(showAllowlist ? [{ name: '🌐 Acesso (Allowlist)', value: 'Servidores e managers autorizados', inline: true }] : []),
      )
      .setTimestamp()
      .setFooter({ text: '⚔️ Aliança Skyline — Admin' });

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('admin:config').setLabel('Configurações').setEmoji('⚙️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('admin:anuncio').setLabel('Anúncio').setEmoji('📢').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('admin:poll').setLabel('Poll').setEmoji('📊').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('admin:evento').setLabel('Evento').setEmoji('📌').setStyle(ButtonStyle.Primary),
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('admin:sorteio').setLabel('Sorteio').setEmoji('🎁').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('admin:encerrar_sorteio').setLabel('Encerrar Sorteio').setEmoji('🏆').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('admin:conquista').setLabel('Conquistas').setEmoji('🏅').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('admin:nivel_reward').setLabel('Recomp. Nível').setEmoji('🎯').setStyle(ButtonStyle.Secondary),
    );
    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('admin:economia').setLabel('Economia').setEmoji('🪙').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('admin:loja').setLabel('Loja').setEmoji('🛍️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('admin:rank').setLabel('Definir Rank').setEmoji('👑').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('admin:stats').setLabel('Estatísticas').setEmoji('📈').setStyle(ButtonStyle.Secondary),
    );

    const components: ActionRowBuilder<ButtonBuilder>[] = [row1, row2, row3];

    if (showAllowlist) {
      const row4 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('admin:allowlist').setLabel('Acesso (Allowlist)').setEmoji('🌐').setStyle(ButtonStyle.Danger),
      );
      components.push(row4);
    }

    await interaction.reply({ embeds: [embed], components, ephemeral: true });
  },
} satisfies Command;
