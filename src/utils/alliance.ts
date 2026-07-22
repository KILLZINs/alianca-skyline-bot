import { Client, EmbedBuilder } from 'discord.js';
import { prisma } from '../database/client';
import { COLORS } from './embeds';
import { applyTemplate } from './embedTemplates';

// URL permanente do banner da Aliança Skyline (asset no repositório)
const ALLIANCE_BANNER_URL = 'https://raw.githubusercontent.com/KILLZINs/alianca-skyline-bot/main/assets/skyline-banner.jpg';

// ─── Classes de servidor ──────────────────────────────────────────────────────

export interface ServerClass {
  name: string;
  emoji: string;
  color: number;
  minMembers: number;
}

export const SERVER_CLASSES: ServerClass[] = [
  { name: 'Cosmos',    emoji: '🌌', color: 0x9B59B6, minMembers: 10000 },
  { name: 'Galaxy',   emoji: '🌠', color: 0x8E44AD, minMembers: 5000  },
  { name: 'Nebula',   emoji: '✨', color: 0x7D3C98, minMembers: 3000  },
  { name: 'Starlight',emoji: '⭐', color: 0x6C3483, minMembers: 1000  },
  { name: 'Moonlight',emoji: '🌙', color: 0x5B2C6F, minMembers: 500   },
  { name: 'Cloud',    emoji: '☁️', color: 0x4A235A, minMembers: 100   },
];

export function getServerClass(memberCount: number): ServerClass {
  for (const cls of SERVER_CLASSES) {
    if (memberCount >= cls.minMembers) return cls;
  }
  return { name: 'Sem Classe', emoji: '⚪', color: 0x808080, minMembers: 0 };
}

export function getNextClass(memberCount: number): { cls: ServerClass; needed: number } | null {
  const ascending = [...SERVER_CLASSES].reverse();
  for (const cls of ascending) {
    if (memberCount < cls.minMembers) return { cls, needed: cls.minMembers - memberCount };
  }
  return null; // já no topo (Cosmos)
}

export async function getAllianceServers() {
  return prisma.allianceServer.findMany({
    include: { members: true },
    orderBy: { memberCount: 'desc' },
  });
}

export async function isAllianceServer(guildId: string): Promise<boolean> {
  return !!(await prisma.allianceServer.findUnique({ where: { guildId } }));
}

// ─── Constrói embed oficial da aliança ────────────────────────────────────────

export async function buildOfficialAllianceEmbed(client: Client): Promise<EmbedBuilder> {
  const servers = await getAllianceServers();

  // Agrupa por classe
  const grouped = new Map<string, typeof servers>();
  for (const cls of SERVER_CLASSES) grouped.set(cls.name, []);
  grouped.set('Sem Classe', []);

  for (const s of servers) {
    const cls = getServerClass(s.memberCount);
    const arr = grouped.get(cls.name) ?? [];
    arr.push(s);
    grouped.set(cls.name, arr);
  }

  const totalMembers = servers.reduce((a, s) => a + s.memberCount, 0);

  let description = '';
  for (const cls of SERVER_CLASSES) {
    const list = grouped.get(cls.name) ?? [];
    if (list.length === 0) continue;

    const range = cls.name === 'Cosmos'
      ? '10.000+'
      : `${cls.minMembers.toLocaleString('pt-BR')}+`;

    description += `\n**${cls.emoji} ${cls.name.toUpperCase()}** *(${range} membros)*\n`;
    for (const s of list) {
      const label = s.guildName ?? s.guildId;
      const link  = s.inviteLink ? `[${label}](${s.inviteLink})` : `**${label}**`;
      description += `┣ ${link} — ${s.memberCount.toLocaleString('pt-BR')} membros\n`;
    }
  }

  if (!description.trim()) description = '*Nenhum servidor cadastrado ainda.*';

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🌌 Aliança Skyline — Servidores Oficiais')
    .setDescription(description)
    .addFields({
      name:   '📊 Resumo',
      value:  `**${servers.length}** servidor(es) • **${totalMembers.toLocaleString('pt-BR')}** membros totais`,
      inline: false,
    })
    .setThumbnail(client.user?.displayAvatarURL() ?? null)
    .setFooter({ text: '⚔️ Aliança Skyline — Unidos somos mais fortes' })
    .setTimestamp()
    .setImage(ALLIANCE_BANNER_URL);
  // applyTemplate é chamado ANTES do setImage final para que o banner hardcoded
  // tenha sempre precedência sobre qualquer valor salvo no banco (imageUrl do template).
  applyTemplate(embed, 'alliance.official');
  embed.setImage(ALLIANCE_BANNER_URL); // garante que o banner sempre aparece
  return embed;
}

// ─── Atualiza classes de todos os servidores ──────────────────────────────────

export async function updateAllServerClasses(client: Client): Promise<{ updated: number; notFound: number }> {
  const servers = await prisma.allianceServer.findMany();
  let updated = 0, notFound = 0;

  for (const s of servers) {
    const guild = client.guilds.cache.get(s.guildId);
    if (!guild) { notFound++; continue; }

    const memberCount = guild.memberCount;
    const cls = getServerClass(memberCount);

    await prisma.allianceServer.update({
      where: { guildId: s.guildId },
      data:  { memberCount, class: cls.name, guildName: guild.name },
    });
    updated++;
  }

  return { updated, notFound };
}
