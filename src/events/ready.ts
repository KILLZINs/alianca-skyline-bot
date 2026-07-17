import { Client, ActivityType, TextChannel, EmbedBuilder } from 'discord.js';
import cron from 'node-cron';
import { prisma } from '../database/client';
import { COLORS, EMOJIS } from '../utils/embeds';

export default {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    console.log(`✅ Bot online como ${client.user?.tag}`);

    const activities = [
      { name: 'Aliança Skyline ⚔️', type: ActivityType.Watching },
      { name: 'com os membros da aliança', type: ActivityType.Playing },
      { name: '/painel para começar', type: ActivityType.Listening },
    ];

    let i = 0;
    client.user?.setPresence({ activities: [activities[0]], status: 'online' });
    setInterval(() => {
      i = (i + 1) % activities.length;
      client.user?.setPresence({ activities: [activities[i]], status: 'online' });
    }, 30_000);

    // Cron: check giveaways every minute
    cron.schedule('* * * * *', async () => {
      const ended = await prisma.giveaway.findMany({
        where: { ended: false, endsAt: { lte: new Date() } },
        include: { entries: { include: { member: true } } },
      });

      for (const giveaway of ended) {
        await prisma.giveaway.update({ where: { id: giveaway.id }, data: { ended: true } });

        const guild = client.guilds.cache.get(giveaway.guildId);
        if (!guild) continue;
        const channel = guild.channels.cache.get(giveaway.channelId) as TextChannel | undefined;
        if (!channel) continue;

        const entries = giveaway.entries;
        const numWinners = Math.min(giveaway.winners, entries.length);
        const winnerIds: string[] = [];

        const shuffled = [...entries].sort(() => Math.random() - 0.5);
        for (let w = 0; w < numWinners; w++) {
          winnerIds.push(shuffled[w].member.discordId);
        }

        await prisma.giveaway.update({ where: { id: giveaway.id }, data: { winnerIds } });

        const mentionList = winnerIds.length
          ? winnerIds.map(id => `<@${id}>`).join(', ')
          : 'Nenhum participante 😔';

        const embed = new EmbedBuilder()
          .setColor(COLORS.GOLD)
          .setTitle(`${EMOJIS.GIFT} Sorteio Encerrado!`)
          .setDescription(`**Prêmio:** ${giveaway.prize}\n\n🎊 **Vencedor(es):** ${mentionList}`)
          .setFooter({ text: '⚔️ Aliança Skyline' })
          .setTimestamp();

        if (giveaway.messageId) {
          try {
            const msg = await channel.messages.fetch(giveaway.messageId);
            await msg.edit({ embeds: [embed], components: [] });
          } catch { /* message may be deleted */ }
        }

        await channel.send({
          content: winnerIds.length ? `🎊 Parabéns ${mentionList}! Você ganhou **${giveaway.prize}**!` : '😔 Nenhum participante no sorteio.',
          embeds: [embed],
        });
      }
    });

    console.log(`📋 ${client.guilds.cache.size} servidor(es) | 👥 ${client.users.cache.size} usuário(s)`);
  },
};
