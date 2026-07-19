import { Client, ActivityType, TextChannel, EmbedBuilder } from 'discord.js';
import cron from 'node-cron';
import { prisma } from '../database/client';
import { COLORS, EMOJIS } from '../utils/embeds';
import { loadAllowlist, isEnforcementActive, isGuildAllowed, getOwnerIds } from '../utils/allowlist';
import { loadBotConfig } from '../utils/botConfig';
import { loadEmbedTemplates } from '../utils/embedTemplates';

export default {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    console.log(`✅ Bot online como ${client.user?.tag}`);

    // ─── Carregar allowlist + configs ─────────────────────────────────────────
    await Promise.all([loadAllowlist(), loadBotConfig(), loadEmbedTemplates()]);
    console.log(`[botConfig] Configuração de embeds carregada.`);
    console.log(`[allowlist] Cache carregado. Enforcement: ${isEnforcementActive() ? 'ATIVO' : 'inativo (lista vazia)'}`);

    // ─── Sair de servidores não autorizados ───────────────────────────────────
    if (isEnforcementActive()) {
      for (const [, guild] of client.guilds.cache) {
        if (!isGuildAllowed(guild.id)) {
          console.log(`[allowlist] Saindo de servidor não autorizado na inicialização: ${guild.name} (${guild.id})`);
          const notifyEmbed = new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle(`${EMOJIS.WARNING} Servidor Removido da Allowlist`)
            .setDescription(
              `O bot foi removido automaticamente do servidor **${guild.name}** (\`${guild.id}\`) por não estar na allowlist.\n\n` +
              `Para reautorizar: \`/botadmin servidor adicionar guild_id:${guild.id}\``
            )
            .setTimestamp();
          for (const ownerId of getOwnerIds()) {
            try {
              const user = await client.users.fetch(ownerId);
              await user.send({ embeds: [notifyEmbed] });
            } catch { /* DMs fechadas */ }
          }
          await guild.leave().catch(console.error);
        }
      }
    }

    // ─── Presença do bot ──────────────────────────────────────────────────────
    const activities = [
      { name: 'Aliança Skyline ⚔️',         type: ActivityType.Watching },
      { name: 'com os membros da aliança',    type: ActivityType.Playing },
      { name: '/painel para começar',         type: ActivityType.Listening },
      { name: '🐉 Boss Mundial ativo!',       type: ActivityType.Competing },
    ];

    let activityIdx = 0;
    client.user?.setPresence({ activities: [activities[0]], status: 'online' });
    setInterval(() => {
      activityIdx = (activityIdx + 1) % activities.length;
      client.user?.setPresence({ activities: [activities[activityIdx]], status: 'online' });
    }, 30_000);

    // ─── Cron: Sorteios (a cada minuto) ──────────────────────────────────────
    cron.schedule('* * * * *', async () => {
      const ended = await prisma.giveaway.findMany({
        where: { ended: false, endsAt: { lte: new Date() } },
        include: { entries: { include: { member: true } } },
      });

      for (const giveaway of ended) {
        const guild = client.guilds.cache.get(giveaway.guildId);
        if (!guild) continue;
        const channel = guild.channels.cache.get(giveaway.channelId) as TextChannel | undefined;
        if (!channel) continue;

        const entries    = giveaway.entries;
        const numWinners = Math.min(giveaway.winners, entries.length);
        const winnerIds: string[] = [];
        const shuffled = [...entries].sort(() => Math.random() - 0.5);
        for (let w = 0; w < numWinners; w++) winnerIds.push(shuffled[w].member.discordId);

        await prisma.giveaway.update({ where: { id: giveaway.id }, data: { ended: true, winnerIds } });

        const mentionList = winnerIds.length ? winnerIds.map(id => `<@${id}>`).join(', ') : 'Nenhum participante 😔';

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

    // ─── Cron: Expirar bosses mundiais e propostas (a cada 15 minutos) ────────
    cron.schedule('*/15 * * * *', async () => {
      try {
        const { expireOldBosses } = await import('../rpg/services/worldBoss');
        const { expireOldProposals } = await import('../rpg/services/marriage');
        await Promise.all([expireOldBosses(), expireOldProposals()]);
      } catch (err) {
        console.error('[Cron] Erro ao expirar bosses/propostas:', err);
      }
    });

    // ─── Cron: Notificar boss expirado em anúncios (a cada hora) ─────────────
    cron.schedule('0 * * * *', async () => {
      try {
        // Verificar bosses que expiraram na última hora e ainda não notificados
        const expiredBosses = await prisma.worldBoss.findMany({
          where: {
            status: 'expired',
            expiresAt: { gte: new Date(Date.now() - 3600_000), lte: new Date() },
          },
        });

        for (const boss of expiredBosses) {
          const guild = client.guilds.cache.get(boss.guildId);
          if (!guild) continue;

          // Tentar encontrar um canal de anúncio
          const config = await prisma.guildConfig.findUnique({ where: { guildId: boss.guildId } });
          const channelId = config?.announcementChannelId ?? config?.welcomeChannelId;
          if (!channelId) continue;

          const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
          if (!channel) continue;

          const embed = new EmbedBuilder()
            .setColor(0x636E72)
            .setTitle(`💨 ${boss.emoji} Boss Mundial Escapou!`)
            .setDescription(
              `**${boss.name}** [Nv.${boss.level}] não foi derrotado a tempo e escapou!\n\n` +
              `HP restante: **${boss.currentHp.toLocaleString('pt-BR')}/${boss.maxHp.toLocaleString('pt-BR')}**\n\n` +
              `*O boss irá retornar mais forte em breve...*`,
            )
            .setTimestamp();

          await channel.send({ embeds: [embed] }).catch(() => null);
        }
      } catch (err) {
        console.error('[Cron] Erro ao notificar boss expirado:', err);
      }
    });

    // ─── Cron: Resetar missões semanais (toda segunda às 00:00) ──────────────
    cron.schedule('0 0 * * 1', async () => {
      try {
        console.log('[Cron] Resetando missões semanais...');
        // As missões semanais são filtradas por weekStr, então são recriadas
        // automaticamente na semana seguinte. Apenas limpar registros muito antigos.
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        // Calcular weekStr de 2 semanas atrás
        const jan1 = new Date(twoWeeksAgo.getFullYear(), 0, 1);
        const oldWeek = Math.ceil(((twoWeeksAgo.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
        const oldWeekStr = `${twoWeeksAgo.getFullYear()}-W${oldWeek.toString().padStart(2, '0')}`;

        await prisma.weeklyMission.deleteMany({
          where: { weekStr: { lte: oldWeekStr } },
        });
        console.log('[Cron] Missões semanais antigas removidas.');
      } catch (err) {
        console.error('[Cron] Erro ao resetar missões semanais:', err);
      }
    });

    console.log(`📋 ${client.guilds.cache.size} servidor(es) | 👥 ${client.users.cache.size} usuário(s)`);
  },
};
