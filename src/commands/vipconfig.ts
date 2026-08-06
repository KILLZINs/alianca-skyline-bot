import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types';
import { prisma } from '../database/client';
import { checkServerOwnerOrRepresentative } from '../utils/permissions';
import { errorEmbed, successEmbed } from '../utils/embeds';

const DEFAULT_FAVORITE_LIMIT = 3;

export default {
  category: 'alianca',
  data: new SlashCommandBuilder()
    .setName('vipconfig')
    .setDescription('Configura limites e tickets do sistema VIP')
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Exibe a configuração VIP atual'),
    )
    .addSubcommand(sub =>
      sub
        .setName('limite')
        .setDescription('Define o limite padrão de favoritos')
        .addIntegerOption(opt =>
          opt
            .setName('quantidade')
            .setDescription('Quantidade máxima padrão de favoritos por VIP')
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('categoria')
        .setDescription('Define a categoria dos tickets de gradiente')
        .addChannelOption(opt =>
          opt
            .setName('canal')
            .setDescription('Categoria onde os tickets de gradiente serão criados')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('usuario')
        .setDescription('Define um limite individual de favoritos')
        .addUserOption(opt => opt.setName('membro').setDescription('Usuário VIP').setRequired(true))
        .addIntegerOption(opt =>
          opt
            .setName('quantidade')
            .setDescription('Novo limite individual')
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('resetar')
        .setDescription('Remove o limite individual e volta ao padrão do servidor')
        .addUserOption(opt => opt.setName('membro').setDescription('Usuário VIP').setRequired(true)),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await checkServerOwnerOrRepresentative(interaction))) return;

    const guildId = interaction.guild!.id;
    const sub = interaction.options.getSubcommand();
    const current = await prisma.vipGuildConfig.findUnique({ where: { guildId } });

    if (sub === 'status') {
      const overrides = await prisma.vipRole.count({ where: { guildId, favoriteLimit: { not: null } } });
      const categoryId = current?.gradientTicketCategoryId;
      return interaction.reply({
        embeds: [
          successEmbed(
            'Configuração VIP',
            `**Limite padrão de favoritos:** ${current?.defaultFavoriteLimit ?? DEFAULT_FAVORITE_LIMIT}\n` +
              `**Categoria de gradiente:** ${categoryId ? `<#${categoryId}>` : 'Não configurada'}\n` +
              `**Limites individuais:** ${overrides} usuário(s)`,
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === 'limite') {
      const quantity = interaction.options.getInteger('quantidade', true);
      await prisma.vipGuildConfig.upsert({
        where: { guildId },
        update: { defaultFavoriteLimit: quantity },
        create: { guildId, defaultFavoriteLimit: quantity },
      });
      return interaction.reply({
        embeds: [successEmbed('Limite Padrão Atualizado', `O limite padrão agora é de **${quantity}** favorito(s) por usuário VIP.`)],
        ephemeral: true,
      });
    }

    if (sub === 'categoria') {
      const category = interaction.options.getChannel('canal', true);
      if (category.type !== ChannelType.GuildCategory) {
        return interaction.reply({ embeds: [errorEmbed('Categoria inválida', 'Selecione uma categoria de canais do Discord.')], ephemeral: true });
      }
      await prisma.vipGuildConfig.upsert({
        where: { guildId },
        update: { gradientTicketCategoryId: category.id },
        create: { guildId, gradientTicketCategoryId: category.id },
      });
      return interaction.reply({
        embeds: [successEmbed('Categoria Configurada', `Os tickets de personalização de gradiente serão criados em ${category}.`)],
        ephemeral: true,
      });
    }

    const target = interaction.options.getUser('membro', true);

    if (sub === 'usuario') {
      const quantity = interaction.options.getInteger('quantidade', true);
      await prisma.vipRole.upsert({
        where: { guildId_userId: { guildId, userId: target.id } },
        update: { favoriteLimit: quantity },
        create: { guildId, userId: target.id, favoriteLimit: quantity },
      });
      return interaction.reply({
        embeds: [successEmbed('Limite Individual Atualizado', `${target} agora pode ter até **${quantity}** favorito(s).`)],
        ephemeral: true,
      });
    }

    await prisma.vipRole.updateMany({
      where: { guildId, userId: target.id },
      data: { favoriteLimit: null },
    });
    return interaction.reply({
      embeds: [successEmbed('Limite Individual Removido', `${target} voltou a usar o limite padrão do servidor.`)],
      ephemeral: true,
    });
  },
} satisfies Command;