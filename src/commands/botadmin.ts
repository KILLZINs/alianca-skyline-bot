import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { prisma } from '../database/client';
import { COLORS, baseEmbed, successEmbed, errorEmbed } from '../utils/embeds';
import {
  isBotOwner, isBotManager,
  isEnforcementActive, allowedGuildCount,
  cacheAddGuild, cacheRemoveGuild,
  cacheAddManager, cacheRemoveManager,
} from '../utils/allowlist';

export default {
  category: 'sistema',
  data: new SlashCommandBuilder()
    .setName('botadmin')
    .setDescription('Gerenciar servidores autorizados e managers do bot (somente donos)')
    .setDMPermission(true)
    .addSubcommandGroup(g =>
      g.setName('servidor')
        .setDescription('Gerenciar servidores autorizados')
        .addSubcommand(s =>
          s.setName('adicionar')
            .setDescription('Autorizar um servidor a usar o bot')
            .addStringOption(o => o.setName('guild_id').setDescription('ID do servidor').setRequired(true))
            .addStringOption(o => o.setName('nota').setDescription('Nota opcional (ex: nome do servidor)').setRequired(false))
        )
        .addSubcommand(s =>
          s.setName('remover')
            .setDescription('Revogar acesso de um servidor')
            .addStringOption(o => o.setName('guild_id').setDescription('ID do servidor').setRequired(true))
        )
        .addSubcommand(s =>
          s.setName('listar')
            .setDescription('Ver todos os servidores autorizados')
        )
        .addSubcommand(s =>
          s.setName('status')
            .setDescription('Ver status atual do sistema de allowlist')
        )
    )
    .addSubcommandGroup(g =>
      g.setName('manager')
        .setDescription('Gerenciar managers do bot (somente donos)')
        .addSubcommand(s =>
          s.setName('adicionar')
            .setDescription('Dar acesso de manager a um usuário')
            .addStringOption(o => o.setName('user_id').setDescription('ID do usuário Discord').setRequired(true))
            .addStringOption(o => o.setName('username').setDescription('Nome do usuário (para referência)').setRequired(false))
        )
        .addSubcommand(s =>
          s.setName('remover')
            .setDescription('Remover acesso de manager de um usuário')
            .addStringOption(o => o.setName('user_id').setDescription('ID do usuário').setRequired(true))
        )
        .addSubcommand(s =>
          s.setName('listar')
            .setDescription('Listar todos os managers')
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const group = interaction.options.getSubcommandGroup(true);
    const sub   = interaction.options.getSubcommand(true);

    // ─── Permissão ────────────────────────────────────────────────────────────
    // Managers podem gerenciar servidores; só donos podem gerenciar managers
    const canManageGuilds   = isBotManager(interaction.user.id);
    const canManageManagers = isBotOwner(interaction.user.id);

    if (!canManageGuilds) {
      return interaction.reply({
        embeds: [errorEmbed('Acesso Negado', 'Você não tem permissão para usar este comando.\nApenas donos e managers do bot podem usá-lo.')],
        ephemeral: true,
      });
    }

    if (group === 'manager' && !canManageManagers) {
      return interaction.reply({
        embeds: [errorEmbed('Acesso Negado', 'Apenas donos do bot podem gerenciar managers.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    // ─── SERVIDOR ─────────────────────────────────────────────────────────────
    if (group === 'servidor') {

      if (sub === 'adicionar') {
        const guildId = interaction.options.getString('guild_id', true).trim();
        const nota    = interaction.options.getString('nota') ?? null;
        // Tentar pegar o nome real do servidor se o bot estiver nele
        const guildObj   = interaction.client.guilds.cache.get(guildId);
        const guildName  = guildObj?.name ?? nota ?? guildId;

        await prisma.allowedGuild.upsert({
          where:  { guildId },
          update: { active: true, guildName, note: nota, addedBy: interaction.user.id },
          create: { guildId, guildName, note: nota, addedBy: interaction.user.id },
        });
        cacheAddGuild(guildId);

        return interaction.editReply({
          embeds: [
            successEmbed('Servidor Autorizado!',
              `**${guildName}** (\`${guildId}\`) foi adicionado à allowlist.\n\n` +
              `🟢 **Total autorizado:** ${allowedGuildCount()} servidor(es)\n` +
              (guildObj ? `✅ Bot já está neste servidor.` : `⚠️ O bot ainda não está neste servidor — convide-o lá.`))
          ],
        });
      }

      if (sub === 'remover') {
        const guildId = interaction.options.getString('guild_id', true).trim();
        const existing = await prisma.allowedGuild.findUnique({ where: { guildId } });
        if (!existing) {
          return interaction.editReply({ embeds: [errorEmbed('Não encontrado', `ID \`${guildId}\` não está na allowlist.`)] });
        }
        await prisma.allowedGuild.update({ where: { guildId }, data: { active: false } });
        cacheRemoveGuild(guildId);

        // Sair do servidor se o bot ainda estiver lá
        const guildObj = interaction.client.guilds.cache.get(guildId);
        if (guildObj) await guildObj.leave().catch(() => null);

        return interaction.editReply({
          embeds: [
            successEmbed('Servidor Removido',
              `**${existing.guildName ?? guildId}** (\`${guildId}\`) foi removido.\n` +
              (guildObj ? '🚪 O bot saiu do servidor.' : '') +
              `\n\n🟢 **Total autorizado:** ${allowedGuildCount()} servidor(es)`)
          ],
        });
      }

      if (sub === 'listar') {
        const guilds = await prisma.allowedGuild.findMany({ where: { active: true }, orderBy: { addedAt: 'asc' } });
        if (!guilds.length) {
          return interaction.editReply({
            embeds: [
              baseEmbed(COLORS.WARNING)
                .setTitle('📋 Allowlist vazia')
                .setDescription('Nenhum servidor autorizado ainda.\n\n> **Modo bootstrap ativo** — qualquer servidor pode usar o bot enquanto a lista estiver vazia.\n\nUse `/botadmin servidor adicionar` para começar a controlar o acesso.')
            ],
          });
        }
        const lines = guilds.map((g, i) => {
          const live = interaction.client.guilds.cache.get(g.guildId);
          const indicator = live ? '🟢' : '⚫';
          return `${indicator} **${g.guildName ?? g.guildId}** \`${g.guildId}\`` +
            (g.note ? ` — ${g.note}` : '') +
            `\n> Adicionado <t:${Math.floor(g.addedAt.getTime() / 1000)}:D> por <@${g.addedBy}>`;
        }).join('\n\n');

        return interaction.editReply({
          embeds: [
            baseEmbed(COLORS.INFO)
              .setTitle(`🌐 Allowlist — ${guilds.length} servidor(es)`)
              .setDescription(lines)
              .setFooter({ text: '🟢 = bot está no servidor  ⚫ = bot não está lá' })
          ],
        });
      }

      if (sub === 'status') {
        const active = isEnforcementActive();
        const count  = allowedGuildCount();
        const botIn  = interaction.client.guilds.cache.size;
        const embed  = baseEmbed(active ? COLORS.SUCCESS : COLORS.WARNING)
          .setTitle(`🔒 Status do Sistema de Acesso`)
          .addFields(
            { name: '📋 Modo',              value: active ? '🔒 **Enforcement ativo**' : '🔓 **Bootstrap** (lista vazia — acesso livre)', inline: false },
            { name: '✅ Servidores na lista', value: `**${count}**`, inline: true },
            { name: '🤖 Bot está em',        value: `**${botIn}** servidor(es)`, inline: true },
          )
          .setDescription(
            active
              ? `Apenas os **${count}** servidores autorizados podem usar o bot.`
              : '⚠️ Lista vazia — **qualquer servidor** pode usar o bot agora.\nAdicione ao menos um servidor para ativar o enforcement.'
          );
        return interaction.editReply({ embeds: [embed] });
      }
    }

    // ─── MANAGER ─────────────────────────────────────────────────────────────
    if (group === 'manager') {

      if (sub === 'adicionar') {
        const userId   = interaction.options.getString('user_id', true).trim();
        const username = interaction.options.getString('username') ?? null;
        if (isBotOwner(userId)) {
          return interaction.editReply({ embeds: [errorEmbed('Desnecessário', 'Este usuário já é dono do bot.')] });
        }
        await prisma.botManager.upsert({
          where:  { userId },
          update: { username: username ?? undefined, addedBy: interaction.user.id },
          create: { userId, username: username ?? undefined, addedBy: interaction.user.id },
        });
        cacheAddManager(userId);
        return interaction.editReply({
          embeds: [successEmbed('Manager Adicionado', `<@${userId}> agora é manager do bot e pode gerenciar a allowlist.`)],
        });
      }

      if (sub === 'remover') {
        const userId = interaction.options.getString('user_id', true).trim();
        const existing = await prisma.botManager.findUnique({ where: { userId } });
        if (!existing) return interaction.editReply({ embeds: [errorEmbed('Não encontrado', `<@${userId}> não é manager.`)] });
        await prisma.botManager.delete({ where: { userId } });
        cacheRemoveManager(userId);
        return interaction.editReply({ embeds: [successEmbed('Manager Removido', `<@${userId}> não é mais manager.`)] });
      }

      if (sub === 'listar') {
        const managers = await prisma.botManager.findMany({ orderBy: { addedAt: 'asc' } });
        const ownerIds = (process.env.BOT_OWNER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
        if (process.env.OWNER_ID) ownerIds.push(process.env.OWNER_ID);
        const ownerLines = [...new Set(ownerIds)].map(id => `👑 <@${id}> — **Dono** (via env)`).join('\n');
        const managerLines = managers.map(m =>
          `🔧 <@${m.userId}>${m.username ? ` — ${m.username}` : ''}\n> Adicionado por <@${m.addedBy}> <t:${Math.floor(m.addedAt.getTime() / 1000)}:D>`
        ).join('\n\n');
        const embed = baseEmbed(COLORS.INFO)
          .setTitle('👥 Donos e Managers do Bot')
          .setDescription([ownerLines, managerLines || '_Nenhum manager adicionado_'].filter(Boolean).join('\n\n'));
        return interaction.editReply({ embeds: [embed] });
      }
    }
  },
} satisfies Command;
