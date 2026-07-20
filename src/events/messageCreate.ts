import { Message, TextChannel, EmbedBuilder, GuildMember } from 'discord.js';
import { addXp, getConfig } from '../utils/helpers';
import { applyChatEnergyRegen } from '../rpg/services/character';
import { COLORS, EMOJIS, levelBar, colorFromLevel } from '../utils/embeds';
import { xpForNextLevel } from '../types';
import { prisma } from '../database/client';

// BUG FIX: cooldown por guildId:userId em vez de só userId
const cooldowns  = new Map<string, number>();
const spamTrack  = new Map<string, { count: number; reset: number }>();
const linkRegex  = /https?:\/\/|discord\.gg\//i;

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
    if (message.author.bot || !message.guild || message.content.startsWith('/')) return;

    const guildId  = message.guild.id;
    const authorId = message.author.id;
    const config   = await getConfig(guildId);

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
      // Garante que as missões do dia existem antes de tentar atualizar
      const { ensureDailyMissions, ensureWeeklyMissions } = await import('../commands/utility/missoes');
      await Promise.all([
        ensureDailyMissions(authorId, guildId),
        ensureWeeklyMissions(authorId, guildId),
      ]).catch(() => null);
    }

    if (config.featMissions) await Promise.all([
      // Diárias
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
      // Semanais
      prisma.weeklyMission.updateMany({
        where: { memberId: authorId, guildId, type: 'enviar_mensagens_sem', weekStr, completed: false },
        data:  { progress: { increment: 1 } },
      }),
      prisma.weeklyMission.updateMany({
        where: { memberId: authorId, guildId, type: 'ganhar_xp_semanal', weekStr, completed: false },
        data:  { progress: { increment: xpGain } },
      }),
    ]).catch(() => null);

    // Marcar missões concluídas (só se featMissions habilitado)
    if (!config.featMissions) {
      // skip mission completion tracking
    } else {
    prisma.dailyMission.findMany({ where: { memberId: authorId, guildId, dateStr, completed: false } })
      .then(pending => Promise.all(
        pending.filter(m => m.progress >= m.target).map(m =>
          prisma.dailyMission.update({ where: { id: m.id }, data: { completed: true } })
        )
      )).catch(() => null);

    // Marcar missões concluídas (semanais)
    prisma.weeklyMission.findMany({ where: { memberId: authorId, guildId, weekStr, completed: false } })
      .then(pending => Promise.all(
        pending.filter(m => m.progress >= m.target).map(m =>
          prisma.weeklyMission.update({ where: { id: m.id }, data: { completed: true } })
        )
      )).catch(() => null);

    } // end featMissions

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
