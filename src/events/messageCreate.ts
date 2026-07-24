import { Message, TextChannel, EmbedBuilder, GuildMember } from 'discord.js';
    import { addXp, getConfig } from '../utils/helpers';
    import { applyChatEnergyRegen } from '../rpg/services/character';
    import { COLORS, EMOJIS, levelBar, colorFromLevel } from '../utils/embeds';
    import { xpForNextLevel, ExtendedClient } from '../types';
    import { getBotConfig } from '../utils/botConfig';
    import { prisma } from '../database/client';
    import { askBryan } from '../ai/bryan';

    // BUG FIX: cooldown por guildId:userId em vez de só userId
    const cooldowns  = new Map<string, number>();
    const spamTrack  = new Map<string, { count: number; reset: number }>();
    const linkRegex  = /https?:\/\/|discord\.gg\//i;

    // ─── Prefix & Bryan ──────────────────────────────────────────────────────────
    const PREFIX         = 'b ';          // ex: "b ping", "b ajuda"
    const BRYAN_REGEX    = /^bryan[,!.?:\s]/i;
    const bryanCooldowns = new Map<string, number>();

    function today() { return new Date().toISOString().slice(0, 10); }

    function thisWeek() {
    const now  = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
    }

    export default {
    name: 'messageCreate',
    once: false,
    async execute(message: Message) {
      if (message.author.bot || !message.guild) return;

      const guildId  = message.guild.id;
      const authorId = message.author.id;
      const content  = message.content.trim();

      // ─── AFK: remover status do autor ao enviar mensagem ─────────────────────
      if (getBotConfig().featAfk) {
        try {
          const authorAfk = await prisma.afkStatus.findUnique({ where: { userId: authorId } });
          if (authorAfk) {
            await prisma.afkStatus.delete({ where: { userId: authorId } });
            const notify = await (message.channel as TextChannel)
              .send({ content: `👋 ${message.author}, seu AFK foi removido!` }).catch(() => null);
            if (notify) setTimeout(() => notify.delete().catch(() => null), 5000);
          }
        } catch { /* tabela pode ainda não existir — ignora silenciosamente */ }

        // ─── AFK: notificar ao mencionar usuário em AFK ─────────────────────────
        if (message.mentions.users.size > 0) {
          for (const [, mentionedUser] of message.mentions.users) {
            if (mentionedUser.bot || mentionedUser.id === authorId) continue;
            try {
              const afk = await prisma.afkStatus.findUnique({ where: { userId: mentionedUser.id } });
              if (!afk) continue;
              const since = Math.floor(afk.setAt.getTime() / 1000);
              const warn = await (message.channel as TextChannel).send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(COLORS.WARNING)
                    .setTitle(`💤 ${mentionedUser.username} está em AFK`)
                    .setDescription(`**Motivo:** ${afk.message}\n**Desde:** <t:${since}:R>`)
                    .setFooter({ text: '⚔️ Aliança Skyline' }),
                ],
              }).catch(() => null);
              if (warn) setTimeout(() => warn.delete().catch(() => null), 8000);
            } catch { /* ignora */ }
          }
        }
      }

      // ─── Bryan I.A. ──────────────────────────────────────────────────────────
      // Ativado quando a mensagem começa com "Bryan" (ex: "Bryan, como entrar?")
      if (BRYAN_REGEX.test(content)) {
        const bryanKey = `${guildId}:${authorId}`;
        const now = Date.now();
        if (now - (bryanCooldowns.get(bryanKey) ?? 0) < 8_000) {
          await message.reply('⏳ Espera um pouquinho antes de me chamar de novo!').catch(() => null);
          return;
        }
        bryanCooldowns.set(bryanKey, now);

        const userMessage = content.replace(/^bryan[,!.?:\s]*/i, '').trim();
        if (!userMessage) {
          await message.reply('👋 Oi! Me faz uma pergunta, pode falar!').catch(() => null);
          return;
        }

        await (message.channel as TextChannel).sendTyping().catch(() => null);
        const displayName = (message.member?.displayName ?? message.author.username);
        const response = await askBryan(userMessage, displayName);
        await message.reply(response).catch(() => null);
        return;
      }

      // ─── Prefix commands ─────────────────────────────────────────────────────
      // Ativado quando a mensagem começa com "b " (ex: "b ping", "b ajuda")
      if (content.toLowerCase().startsWith(PREFIX)) {
        const args    = content.slice(PREFIX.length).trim().split(/\s+/);
        const cmdName = args.shift()?.toLowerCase() ?? '';
        if (!cmdName) return;

        const extClient = message.client as ExtendedClient;
        const cmd = extClient.prefixCommands?.get(cmdName);
        if (!cmd) return;

        try {
          await cmd.execute(message, args);
        } catch (err) {
          console.error(`[Prefix] Erro no comando ${cmdName}:`, err);
          await message.reply('❌ Erro ao executar esse comando.').catch(() => null);
        }
        return;
      }

      // Não processar mais nada para mensagens de slash command ou DMs
      if (message.content.startsWith('/')) return;

      const config = await getConfig(guildId);

      // ─── Track daily message count ────────────────────────────────────────────
      prisma.serverStat.upsert({
        where:  { guildId_date: { guildId, date: today() } },
        update: { messages: { increment: 1 } },
        create: { guildId, date: today(), messages: 1 },
      }).catch(() => null);

      // ─── Anti-spam ────────────────────────────────────────────────────────────
      if (config.antiSpam) {
        const key   = `${guildId}:${authorId}`;
        const now   = Date.now();
        const entry = spamTrack.get(key) ?? { count: 0, reset: now + 5000 };
        if (now > entry.reset) { entry.count = 0; entry.reset = now + 5000; }
        entry.count++;
        spamTrack.set(key, entry);
        if (entry.count > 5) {
          await message.delete().catch(() => null);
          const warn = await (message.channel as TextChannel)
            .send({ content: `${message.author}, devagar! ⚠️ Anti-spam ativado.` }).catch(() => null);
          if (warn) setTimeout(() => warn.delete().catch(() => null), 4000);
          return;
        }
      }

      // ─── Anti-links ───────────────────────────────────────────────────────────
      if (config.antiLinks && linkRegex.test(message.content)) {
        const mem = message.member as GuildMember;
        if (!mem?.permissions.has('ManageMessages')) {
          await message.delete().catch(() => null);
          const warn = await (message.channel as TextChannel)
            .send({ content: `${message.author}, links não são permitidos aqui! 🔗` }).catch(() => null);
          if (warn) setTimeout(() => warn.delete().catch(() => null), 4000);
          return;
        }
      }

      // ─── Feature gate: XP/Leveling ───────────────────────────────────────────
      if (!config.featLeveling) return;

      // ─── XP cooldown — chave por guildId:userId ───────────────────────────────
      const now       = Date.now();
      const cdKey     = `${guildId}:${authorId}`;
      const cooldownMs = (config.xpCooldown ?? 60) * 1000;
      if (now - (cooldowns.get(cdKey) ?? 0) < cooldownMs) return;
      cooldowns.set(cdKey, now);

      const xpMin  = config.xpMin ?? 15;
      const xpMax  = config.xpMax ?? 25;
      const xpGain = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;

      const before = await prisma.member.findUnique({ where: { discordId: authorId } });
      const after  = await addXp(authorId, message.author.username, xpGain);

      // ─── RPG: regen de energia via chat (fire-and-forget) ────────────────────
      applyChatEnergyRegen(authorId).catch(() => null);

      // ─── Mission progress (only if featMissions enabled) ─────────────────────
      const dateStr = today();
      const weekStr = thisWeek();

      if (config.featMissions) {
        const { ensureDailyMissions, ensureWeeklyMissions } = await import('../commands/utility/missoes');
        await Promise.all([
          ensureDailyMissions(authorId, guildId),
          ensureWeeklyMissions(authorId, guildId),
        ]).catch(() => null);
      }

      if (config.featMissions) await Promise.all([
        prisma.dailyMission.updateMany({
          where: { memberId: authorId, guildId, type: 'estar_online',     dateStr, completed: false },
          data:  { progress: 1, completed: true },
        }),
        prisma.dailyMission.updateMany({
          where: { memberId: authorId, guildId, type: 'enviar_mensagens', dateStr, completed: false },
          data:  { progress: { increment: 1 } },
        }),
        prisma.dailyMission.updateMany({
          where: { memberId: authorId, guildId, type: 'ganhar_xp',        dateStr, completed: false },
          data:  { progress: { increment: xpGain } },
        }),
        prisma.weeklyMission.updateMany({
          where: { memberId: authorId, guildId, type: 'enviar_mensagens_sem', weekStr, completed: false },
          data:  { progress: { increment: 1 } },
        }),
        prisma.weeklyMission.updateMany({
          where: { memberId: authorId, guildId, type: 'ganhar_xp_semanal', weekStr, completed: false },
          data:  { progress: { increment: xpGain } },
        }),
      ]).catch(() => null);

      if (!config.featMissions) {
        // skip mission completion tracking
      } else {
        prisma.dailyMission.findMany({ where: { memberId: authorId, guildId, dateStr, completed: false } })
          .then(pending => Promise.all(
            pending.filter(m => m.progress >= m.target).map(m =>
              prisma.dailyMission.update({ where: { id: m.id }, data: { completed: true } })
            )
          )).catch(() => null);

        prisma.weeklyMission.findMany({ where: { memberId: authorId, guildId, weekStr, completed: false } })
          .then(pending => Promise.all(
            pending.filter(m => m.progress >= m.target).map(m =>
              prisma.weeklyMission.update({ where: { id: m.id }, data: { completed: true } })
            )
          )).catch(() => null);
      }

      // ─── Level up ─────────────────────────────────────────────────────────────
      if (before && after.level > before.level) {
        prisma.levelReward.findUnique({ where: { guildId_level: { guildId, level: after.level } } })
          .then(async reward => {
            if (!reward) return;
            if (reward.roleId) await (message.member as GuildMember)?.roles.add(reward.roleId).catch(() => null);
            if (reward.coins > 0) {
              await prisma.member.update({
                where: { discordId: authorId },
                data:  { coins: { increment: reward.coins } },
              });
            }
          }).catch(() => null);

        const channelId = config.levelUpChannelId ?? message.channel.id;
        const channel   = message.guild.channels.cache.get(channelId) as TextChannel | undefined;
        if (!channel) return;

        const { applyTemplate: applyLevelUpTemplate } = await import('../utils/embedTemplates');
        const embed = new EmbedBuilder()
          .setColor(colorFromLevel(after.level))
          .setTitle(`${EMOJIS.LEVEL} Level Up!`)
          .setThumbnail(message.author.displayAvatarURL())
          .setDescription(
            `Parabéns ${message.author}! Você subiu para o **Nível ${after.level}**! 🎉\n\n` +
            `\`${levelBar(after.xp, xpForNextLevel(after.level))}\``
          )
          .setFooter({ text: `⚔️ ${message.guild.name}` })
          .setTimestamp();

        applyLevelUpTemplate(embed, 'levelup');
        await channel.send({ embeds: [embed] }).catch(console.error);
      }
    },
    };
    