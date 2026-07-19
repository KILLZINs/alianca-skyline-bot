// ═══════════════════════════════════════════════════════════════════════
// COMANDO /cargo-menu — Sistema de Registro de Cargos por botão
// ═══════════════════════════════════════════════════════════════════════

import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder,
  TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { Command } from '../types';
import { checkAdmin } from '../utils/permissions';
import { errorEmbed } from '../utils/embeds';
import { prisma } from '../database/client';

export type SelfRoleMenuWithEntries = {
  id: string; title: string; description: string | null;
  channelId: string; messageId: string | null;
  entries: { roleId: string; label: string; emoji: string | null }[];
};

export function buildMenuMessage(menu: SelfRoleMenuWithEntries) {
  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(menu.title)
    .setDescription(
      (menu.description ?? 'Clique nos botões abaixo para adicionar ou remover cargos.') +
      '\n\n*Clique novamente para remover um cargo já obtido.*'
    )
    .setFooter({ text: '⚔️ Aliança Skyline — Registro de Cargos' });

  const components: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < menu.entries.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      menu.entries.slice(i, i + 5).map(e => {
        const btn = new ButtonBuilder()
          .setCustomId(`selfrole:toggle:${e.roleId}`)
          .setLabel(e.label)
          .setStyle(ButtonStyle.Secondary);
        if (e.emoji) btn.setEmoji(e.emoji);
        return btn;
      })
    );
    components.push(row);
  }

  return { embeds: [embed], components };
}

export default {
  category: 'admin',
  data: new SlashCommandBuilder()
    .setName('cargo-menu')
    .setDescription('[ADMIN] Cria e gerencia menus de auto-cargo para membros')
    .addSubcommand(sub =>
      sub.setName('criar').setDescription('Cria um novo menu de cargos neste canal')
    )
    .addSubcommand(sub =>
      sub.setName('adicionar-cargo').setDescription('Adiciona um cargo ao menu ativo neste canal')
    )
    .addSubcommand(sub =>
      sub.setName('publicar').setDescription('Publica ou atualiza o menu neste canal')
    )
    .addSubcommand(sub =>
      sub.setName('listar').setDescription('Lista todos os menus deste servidor')
    )
    .addSubcommand(sub =>
      sub.setName('remover-cargo')
        .setDescription('Remove um cargo do menu deste canal')
        .addStringOption(o =>
          o.setName('cargo_id').setDescription('ID do cargo a remover').setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await checkAdmin(interaction))) return;

    const sub = interaction.options.getSubcommand();
    const guildId  = interaction.guildId!;
    const channelId = interaction.channelId;

    // ── Criar menu ────────────────────────────────────────────────────────
    if (sub === 'criar') {
      const modal = new ModalBuilder()
        .setCustomId('cargo_menu:criar')
        .setTitle('Criar Menu de Cargos');
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId('titulo').setLabel('Título do menu')
            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
            .setPlaceholder('Ex: 🎭 Escolha seus cargos'),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId('descricao').setLabel('Descrição (opcional)')
            .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(500)
            .setPlaceholder('Selecione os cargos que representam você.'),
        ),
      );
      return interaction.showModal(modal);
    }

    // ── Adicionar cargo ───────────────────────────────────────────────────
    if (sub === 'adicionar-cargo') {
      const menu = await prisma.selfRoleMenu.findFirst({
        where: { guildId, channelId },
        include: { entries: true },
        orderBy: { createdAt: 'desc' },
      });
      if (!menu) {
        return interaction.reply({
          embeds: [errorEmbed('Sem Menu', 'Nenhum menu encontrado neste canal. Use `/cargo-menu criar` primeiro.')],
          ephemeral: true,
        });
      }
      if (menu.entries.length >= 25) {
        return interaction.reply({
          embeds: [errorEmbed('Limite Atingido', 'Um menu pode ter no máximo 25 cargos (5 linhas × 5 botões).')],
          ephemeral: true,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`cargo_menu:adicionar:${menu.id}`)
        .setTitle('Adicionar Cargo ao Menu');
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId('role_id').setLabel('ID do Cargo')
            .setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 123456789012345678'),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId('label').setLabel('Nome do botão')
            .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80)
            .setPlaceholder('Ex: Gamer'),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId('emoji').setLabel('Emoji (opcional, 1 emoji)')
            .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(4)
            .setPlaceholder('Ex: 🎮'),
        ),
      );
      return interaction.showModal(modal);
    }

    // ── Publicar menu ─────────────────────────────────────────────────────
    if (sub === 'publicar') {
      await interaction.deferReply({ ephemeral: true });
      const menu = await prisma.selfRoleMenu.findFirst({
        where: { guildId, channelId },
        include: { entries: true },
        orderBy: { createdAt: 'desc' },
      }) as SelfRoleMenuWithEntries | null;

      if (!menu) {
        return interaction.editReply({
          embeds: [errorEmbed('Sem Menu', 'Nenhum menu encontrado neste canal.')],
        });
      }
      if (!menu.entries.length) {
        return interaction.editReply({
          embeds: [errorEmbed('Menu Vazio', 'Adicione pelo menos um cargo com `/cargo-menu adicionar-cargo` antes de publicar.')],
        });
      }

      const msgData = buildMenuMessage(menu);
      const channel = interaction.channel!;

      if (menu.messageId) {
        try {
          const msg = await channel.messages.fetch(menu.messageId);
          await msg.edit(msgData);
          return interaction.editReply({
            embeds: [new EmbedBuilder().setColor(0x2ECC71).setDescription(`✅ Menu **${menu.title}** atualizado com sucesso!`)],
          });
        } catch { /* mensagem foi deletada, enviar nova */ }
      }

      const msg = await channel.send(msgData);
      await prisma.selfRoleMenu.update({ where: { id: menu.id }, data: { messageId: msg.id } });
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x2ECC71).setDescription(`✅ Menu **${menu.title}** publicado com **${menu.entries.length}** cargo(s)!`)],
      });
    }

    // ── Listar menus ──────────────────────────────────────────────────────
    if (sub === 'listar') {
      await interaction.deferReply({ ephemeral: true });
      const menus = await prisma.selfRoleMenu.findMany({
        where: { guildId },
        include: { entries: true },
        orderBy: { createdAt: 'desc' },
      });
      if (!menus.length) {
        return interaction.editReply({ embeds: [errorEmbed('Sem Menus', 'Nenhum menu criado ainda. Use `/cargo-menu criar`.')] });
      }
      const lines = menus.map(m =>
        `**${m.title}** — <#${m.channelId}> — ${m.entries.length} cargo(s)${m.messageId ? ' ✅ publicado' : ' ⏳ não publicado'}`
      ).join('\n');
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x9B59B6).setTitle('📋 Menus de Cargo').setDescription(lines)],
      });
    }

    // ── Remover cargo ─────────────────────────────────────────────────────
    if (sub === 'remover-cargo') {
      await interaction.deferReply({ ephemeral: true });
      const raw = interaction.options.getString('cargo_id', true).replace(/[<@&>]/g, '').trim();
      const menu = await prisma.selfRoleMenu.findFirst({
        where: { guildId, channelId },
        include: { entries: true },
        orderBy: { createdAt: 'desc' },
      });
      if (!menu) {
        return interaction.editReply({ embeds: [errorEmbed('Sem Menu', 'Nenhum menu encontrado neste canal.')] });
      }
      const entry = menu.entries.find(e => e.roleId === raw);
      if (!entry) {
        return interaction.editReply({
          embeds: [errorEmbed('Não Encontrado', `Cargo \`${raw}\` não está neste menu.`)],
        });
      }
      await prisma.selfRoleEntry.delete({ where: { id: entry.id } });
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x2ECC71)
          .setDescription(`✅ Cargo removido do menu. Use \`/cargo-menu publicar\` para atualizar a mensagem.`)],
      });
    }
  },
} satisfies Command;
