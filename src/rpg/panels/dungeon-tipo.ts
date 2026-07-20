// ═══════════════════════════════════════════════════════════════════════
// DUNGEON POR TIPO — Seleção de tipo + combate com modificadores
// ═══════════════════════════════════════════════════════════════════════

import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} from 'discord.js';
import { prisma } from '../../database/client';
import { FullCharacter, computeStats, hpBar } from '../services/character';
import { DUNGEON_TYPES, DUNGEON_TYPE_LIST, getDungeonType, type DungeonType } from '../constants/dungeon-types';
import { getLocation } from '../constants/locations';
import { getEnemiesForLocation, getBossesForLocation, scaleEnemy } from '../constants/enemies';
import { getDayPhase, PHASE_INFO } from '../services/day-night';
import { giveItem } from '../services/combat';

export function buildDungeonTypeEmbed(char: FullCharacter): EmbedBuilder {
  const loc = getLocation(char.currentLocation);
  const stats = computeStats(char);
  const phase = getDayPhase();
  const phaseInfo = PHASE_INFO[phase];

  if (loc.isSafeZone || !loc.hasDungeon) {
    return new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('⚔️ Tipos de Dungeon')
      .setDescription('Você está em uma zona segura. Viaje para uma região com dungeon!');
  }

  const availableTypes = DUNGEON_TYPE_LIST.filter(t => char.level >= t.minLevel);

  return new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle(`⚔️ Dungeon Avançada — ${loc.emoji} ${loc.name}`)
    .setDescription(
      `Escolha o **tipo de dungeon** para uma experiência diferente!\nCada tipo tem **efeitos especiais** e multiplicadores de XP/Ouro únicos.\n\n` +
      `${phaseInfo.emoji} **${phaseInfo.name}**: ${phaseInfo.xpBonus > 0 ? `+${Math.round(phaseInfo.xpBonus * 100)}% XP adicional` : phaseInfo.desc}`,
    )
    .addFields(
      {
        name: '🎯 Tipos Disponíveis',
        value: availableTypes.map(t =>
          `${t.emoji} **${t.name}** (Nv.${t.minLevel}+) — ${t.specialEffect}\n` +
          `> XP: ×${t.xpMult} | Ouro: ×${t.goldMult} | Inimigos: ×${t.enemyHpMult} HP`,
        ).join('\n\n'),
        inline: false,
      },
      { name: '❤️ HP',     value: `${hpBar(char.currentHp, stats.maxHp)} **${char.currentHp}/${stats.maxHp}**`, inline: true },
      { name: '⚡ Energia', value: `**${char.currentEnergy}/${stats.maxEnergy}**`, inline: true },
    )
    .setFooter({ text: '⚔️ Dungeons de tipo especial dão muito mais recompensa!' });
}

export function buildDungeonTypeSelect(char: FullCharacter): ActionRowBuilder<StringSelectMenuBuilder> {
  const availableTypes = DUNGEON_TYPE_LIST.filter(t => char.level >= t.minLevel);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('rpg_select:dungeon_tipo_escolher')
      .setPlaceholder('Escolha o tipo de dungeon...')
      .addOptions(
        availableTypes.map(t =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`${t.emoji} ${t.name}`)
            .setValue(t.id)
            .setDescription(`XP ×${t.xpMult} | Ouro ×${t.goldMult} | ${t.specialEffect.slice(0, 50)}`),
        ),
      ),
  );
}

export function buildDungeonTypeButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Dungeon Normal').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(ButtonStyle.Secondary),
  );
}

// ─── Combate com tipo de dungeon ──────────────────────────────────────────────

export async function doBattleWithType(
  char: FullCharacter,
  dungeonTypeId: string,
  useRandom: boolean = true,
  enemyId?: string,
): Promise<{ embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] }> {
  const dungeonType = getDungeonType(dungeonTypeId);
  const loc = getLocation(char.currentLocation);
  const stats = computeStats(char);
  const phase = getDayPhase();
  const phaseInfo = PHASE_INFO[phase];

  // Escolher inimigo
  let baseEnemy = useRandom
    ? (() => { const list = getEnemiesForLocation(loc.id, char.level); return list[Math.floor(Math.random() * list.length)]; })()
    : getEnemiesForLocation(loc.id, char.level).find(e => e.id === enemyId) ?? getEnemiesForLocation(loc.id, char.level)[0];

  if (!baseEnemy) {
    return {
      embed: new EmbedBuilder().setColor(0xFF0000).setTitle('Sem Inimigos').setDescription('Nenhum inimigo disponível aqui neste nível.'),
      rows: [],
    };
  }

  const enemy = scaleEnemy(baseEnemy, char.level);
  // Aplicar multiplicador do tipo de dungeon
  let enemyHp = Math.round(enemy.baseHp * dungeonType.enemyHpMult * (phaseInfo.enemyMult));
  const enemyAtk = Math.round(enemy.baseAttack * dungeonType.enemyAtkMult * phaseInfo.enemyMult);

  const log: string[] = [];
  let playerHp = char.currentHp;
  let playerEnergy = char.currentEnergy;
  const MAX_ROUNDS = 15;
  let round = 0;
  let frozenRounds = 0;

  log.push(`${dungeonType.emoji} **Dungeon ${dungeonType.name}** — ${enemy.emoji} **${enemy.name}**`);
  log.push(`Efeito: *${dungeonType.specialEffect}*`);
  log.push(`❤️ Seu HP: **${playerHp}/${stats.maxHp}** | HP Inimigo: **${enemyHp}**\n`);

  while (round < MAX_ROUNDS && playerHp > 0 && enemyHp > 0) {
    round++;
    log.push(`**— Rodada ${round} —**`);

    // DoT no jogador (fogo/sombra/abissal)
    if (dungeonType.dotDamage > 0 && round > 1) {
      playerHp = Math.max(0, playerHp - dungeonType.dotDamage);
      log.push(`${dungeonType.dotEmoji} **${dungeonType.dotName}**: -${dungeonType.dotDamage} HP`);
    }

    // Congelamento (gelo)
    if (dungeonType.freezeChance > 0 && Math.random() < dungeonType.freezeChance) {
      frozenRounds = 1;
    }

    if (frozenRounds > 0) {
      log.push(`❄️ Você está congelado! Perde o turno.`);
      frozenRounds = 0;
    } else {
      // Ataque do jogador
      const critBonus = dungeonType.critBonus;
      const isCrit = Math.random() < (stats.critChance / 100 + critBonus);
      let dmg = Math.max(1, stats.attack - Math.floor(enemy.baseDefense * 0.4));
      if (isCrit) { dmg = Math.round(dmg * (dungeonType.id === 'trovao' ? 1.5 : 1.3)); }
      enemyHp = Math.max(0, enemyHp - dmg);
      log.push(`⚔️ Você causa **${dmg}**${isCrit ? ' 💥 CRÍTICO!' : ''}`);
    }

    if (enemyHp <= 0) break;

    // Ataque do inimigo
    const dodge = Math.random() * 100 < stats.dodgeChance;
    if (dodge) {
      log.push(`💨 Você esquivou!`);
    } else {
      const inDmg = Math.max(1, enemyAtk - Math.floor(stats.defense * 0.5));
      playerHp = Math.max(0, playerHp - inDmg);
      log.push(`💢 ${enemy.name} causa **${inDmg}**`);
    }

    if (playerHp > 0 && enemyHp > 0) {
      log.push(`> ❤️ ${playerHp} | ${enemy.emoji} ${enemyHp}`);
    }
  }

  // Resultado
  const won = playerHp > 0 && enemyHp <= 0;
  const energyCost = 12;
  playerEnergy = Math.max(0, playerEnergy - energyCost);

  let xpGained = 0, goldGained = 0;
  const itemsDropped: string[] = [];

  if (won) {
    xpGained  = Math.round(enemy.xpReward  * dungeonType.xpMult   * (1 + phaseInfo.xpBonus));
    goldGained = Math.round((Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1)) + enemy.goldMin) * dungeonType.goldMult * (1 + phaseInfo.goldBonus));

    // Drop de itens
    for (const drop of (enemy.dropTable ?? [])) {
      if (Math.random() * 100 < (drop.chance * (1 + dungeonType.dropRarityBonus))) {
        itemsDropped.push(drop.itemId);
        await giveItem(char.discordId, drop.itemId, 1).catch(() => null);
      }
    }
  }

  await prisma.rpgCharacter.update({
    where: { discordId: char.discordId },
    data: {
      currentHp: playerHp,
      currentEnergy: playerEnergy,
      gold: won ? { increment: goldGained } : undefined,
      totalWins: won ? { increment: 1 } : undefined,
      totalDeaths: !won ? { increment: 1 } : undefined,
      totalKills: won ? { increment: 1 } : undefined,
      lastDungeon: new Date(),
    },
  });

  if (xpGained > 0) {
    await prisma.rpgCharacter.update({ where: { discordId: char.discordId }, data: { xp: { increment: xpGained } } });
  }

  const color = won ? dungeonType.color : 0x555555;
  const title = won
    ? `${dungeonType.emoji} Vitória na Dungeon ${dungeonType.name}!`
    : `💀 Derrota na Dungeon ${dungeonType.name}`;

  const logSlice = log.slice(-12).join('\n');

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(logSlice)
    .addFields(
      { name: '⭐ XP',  value: won ? `+**${xpGained}**` : '—', inline: true },
      { name: '💰 Ouro', value: won ? `+**${goldGained}**` : '—', inline: true },
      { name: `❤️ HP Restante`, value: `**${playerHp}/${stats.maxHp}**`, inline: true },
    );

  if (itemsDropped.length) {
    const { getItem } = await import('../constants/items');
    embed.addFields({ name: '🎁 Drop!', value: itemsDropped.map(id => getItem(id)?.name ?? id).join(', ') });
  }

  const rows: ActionRowBuilder<ButtonBuilder>[] = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`rpg:dungeon_tipo`).setLabel(`${dungeonType.emoji} Repetir ${dungeonType.name}`).setStyle(ButtonStyle.Danger).setDisabled(playerHp <= 0),
      new ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Dungeon Normal').setStyle(ButtonStyle.Secondary),
      ...(playerHp <= 0 ? [new ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏥 Curar').setStyle(ButtonStyle.Success)] : []),
      new ButtonBuilder().setCustomId('rpg:perfil').setLabel('👤 Perfil').setStyle(ButtonStyle.Secondary),
    ),
  ];

  return { embed, rows };
}
