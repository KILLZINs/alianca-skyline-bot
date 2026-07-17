import { Message, TextChannel, EmbedBuilder } from 'discord.js';
import { addXp, getConfig } from '../utils/helpers';
import { COLORS, EMOJIS, levelBar, colorFromLevel } from '../utils/embeds';
import { xpForNextLevel } from '../types';
import { prisma } from '../database/client';

const cooldowns = new Map<string, number>();

export default {
  name: 'messageCreate',
  once: false,
  async execute(message: Message) {
    if (message.author.bot || !message.guild || message.content.startsWith('/')) return;

    // XP cooldown: 1 message per minute per user
    const now = Date.now();
    const last = cooldowns.get(message.author.id) ?? 0;
    if (now - last < 60_000) return;
    cooldowns.set(message.author.id, now);

    const xpGain = Math.floor(Math.random() * 11) + 15; // 15-25 XP
    const before = await prisma.member.findUnique({ where: { discordId: message.author.id } });
    const after = await addXp(message.author.id, message.author.username, xpGain);

    // Level up!
    if (before && after.level > before.level) {
      const config = await getConfig(message.guild.id);
      const channelId = config.levelUpChannelId ?? message.channel.id;
      const channel = message.guild.channels.cache.get(channelId) as TextChannel | undefined;
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor(colorFromLevel(after.level))
        .setTitle(`${EMOJIS.LEVEL} Level Up!`)
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(
          `Parabéns ${message.author}! Você subiu para o **Nível ${after.level}**! 🎉\n\n` +
          `\`${levelBar(after.xp, xpForNextLevel(after.level))}\``
        )
        .setFooter({ text: '⚔️ Aliança Skyline' })
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(console.error);
    }
  },
};
