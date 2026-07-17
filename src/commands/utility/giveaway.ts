import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../types';
import { prisma } from '../../database/client';
import { COLORS, baseEmbed, successEmbed, errorEmbed } from '../../utils/embeds';
import { checkAdmin } from '../../utils/permissions';
import { parseDuration } from '../../utils/helpers';

export default {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Gerencia sorteios do servidor')
    .addSubcommand(sub =>
      sub.setName('criar').setDescription('Cria um novo sorteio (admin)')
        .addStringOption(opt => opt.setName('premio').setDescription('Prêmio do sorteio').setRequired(true))
        .addIntegerOption(opt => opt.setName('vencedores').setDescription('Número de vencedores').setRequired(true).setMinValue(1).setMaxValue(20))
        .addStringOption(opt => opt.setName('duracao').setDescription('Duração: 1h, 2d, 30m').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('encerrar').setDescription('Encerra um sorteio antecipadamente (admin)')
        .addStringOption(opt => opt.setName('id').setDescription('ID do sorteio').setRequired(true))
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await checkAdmin(interaction))) return;
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (sub === 'criar') {
      const premio = interaction.options.getString('premio', true);
      const vencedores = interaction.options.getInteger('vencedores', true);
      const duracaoStr = interaction.options.getString('duracao', true);
      const ms = parseDuration(duracaoStr);
      if (!ms) return interaction.reply({ embeds: [errorEmbed('Duração inválida', 'Use: `1h`, `2d`, `30m`')], ephemeral: true });
      const endsAt = new Date(Date.now() + ms);

      await interaction.deferReply({ ephemeral: true });
      const channel = interaction.channel as TextChannel;
      const giveaway = await prisma.giveaway.create({ data: { guildId: guild.id, channelId: channel.id, prize: premio, winners: vencedores, hostId: interaction.user.id, endsAt } });

      const embed = baseEmbed(COLORS.GOLD)
        .setTitle(`🎁 Sorteio — ${premio}`)
        .addFields(
          { name: '🏆 Vencedores', value: `**${vencedores}**`, inline: true },
          { name: '⏰ Encerra', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true },
          { name: '👑 Criado por', value: `${interaction.user}`, inline: true },
        )
        .setFooter({ text: '0 participantes • ⚔️ Aliança Skyline' });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`giveaway:join:${giveaway.id}`).setLabel('Participar').setEmoji('🎁').setStyle(ButtonStyle.Success),
      );

      const msg = await channel.send({ embeds: [embed], components: [row] });
      await prisma.giveaway.update({ where: { id: giveaway.id }, data: { messageId: msg.id } });
      await interaction.editReply({ embeds: [successEmbed('Sorteio Criado!', `Sorteio publicado em ${channel}`)] });
    }

    else if (sub === 'encerrar') {
      const id = interaction.options.getString('id', true);
      await interaction.deferReply({ ephemeral: true });
      const giveaway = await prisma.giveaway.findUnique({ where: { id }, include: { entries: { include: { member: true } } } });
      if (!giveaway || giveaway.guildId !== guild.id) return interaction.editReply({ embeds: [errorEmbed('Não encontrado', 'Sorteio não encontrado.')] });
      if (giveaway.ended) return interaction.editReply({ embeds: [errorEmbed('Já encerrado', 'Este sorteio já foi encerrado.')] });

      const entries = giveaway.entries;
      const shuffled = entries.sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, giveaway.winners);
      const winnerMentions = chosen.map(e => `<@${e.member.discordId}>`).join(', ') || 'Nenhum participante.';

      await prisma.giveaway.update({ where: { id }, data: { ended: true } });

      const channel = guild.channels.cache.get(giveaway.channelId) as TextChannel | undefined;
      if (channel) {
        await channel.send({ embeds: [baseEmbed(COLORS.GOLD).setTitle('🎉 Sorteio Encerrado!').setDescription(`**Prêmio:** ${giveaway.prize}\n**Vencedor(es):** ${winnerMentions}`).setFooter({ text: '⚔️ Aliança Skyline' })] });
        if (giveaway.messageId) {
          const msg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
          if (msg) await msg.edit({ components: [] }).catch(() => null);
        }
      }
      await interaction.editReply({ embeds: [successEmbed('Encerrado!', `Vencedor(es): ${winnerMentions}`)] });
    }
  },
} satisfies Command;
