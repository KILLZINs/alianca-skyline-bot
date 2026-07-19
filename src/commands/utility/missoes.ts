import { prisma } from '../../database/client';

const MISSION_TYPES = [
  { type: 'enviar_mensagens', label: '💬 Enviar mensagens', target: 20, xpReward: 50, coinReward: 30 },
  { type: 'ganhar_xp',        label: '💜 Ganhar XP',        target: 100, xpReward: 80, coinReward: 50 },
  { type: 'estar_online',     label: '🟢 Login diário',      target: 1,   xpReward: 30, coinReward: 20 },
] as const;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function ensureDailyMissions(discordId: string, guildId: string) {
  const today = todayStr();
  for (const m of MISSION_TYPES) {
    await prisma.dailyMission.upsert({
      where: { memberId_guildId_type_dateStr: { memberId: discordId, guildId, type: m.type, dateStr: today } },
      update: {},
      create: { memberId: discordId, guildId, type: m.type, target: m.target, xpReward: m.xpReward, coinReward: m.coinReward, dateStr: today },
    });
  }
}
