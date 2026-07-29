import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} from 'discord.js';
import { FullCharacter, computeStats, hpBar } from '../services/character';
import { getLocation } from '../constants/locations';
import { getEnemiesForLocation, getBossesForLocation, getEnemy } from '../constants/enemies';
import { getItem } from '../constants/items';
import { isDungeonOnCooldown } from '../services/combat';
import { runCombat } from '../services/combat';
import { applyTemplate } from '../../utils/embedTemplates';

export function buildDungeonEmbed(char: FullCharacter): EmbedBuilder {
  const loc = getLocation(char.currentLocation);
  const stats = computeStats(char);

  if (loc.isSafeZone) {
    return new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('⚔️ Dungeons')
      .setDescription(`Você está em uma **zona segura** (${loc.name}).\nViaje para uma região com dungeon primeiro!`)
      .setFooter({ text: '⚔️ Use 🗺️ Viajar para escolher uma região com dungeon.' });
  }

  if (!loc.hasDungeon) {
    return new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('⚔️ Dungeons')
      .setDescription(`${loc.name} não tem dungeon. Tente outra região!`);
  }

  const enemies = getEnemiesForLocation(loc.id, char.level);
  const bosses  = getBossesForLocation(loc.id).filter(b => char.level >= b.minLevel);
  const cd = isDungeonOnCooldown(char, 5); // 5 min cooldown padrão

  const enemyList = enemies.slice(0, 5).map(e => `${e.emoji} **${e.name}** — ${e.xpReward} XP | ${e.goldMin}~${e.goldMax} 💰`).join('\n') || '*Nenhum inimigo no seu nível aqui.*';
  const bossList  = bosses.length > 0
    ? bosses.map(b => `${b.emoji} **${b.name}** [BOSS] — ${b.xpReward} XP | ${b.goldMin}~${b.goldMax} 💰`).join('\n')
    : '*Nenhum boss disponível (Nível insuficiente)*';

  const hpPct = stats.maxHp > 0 ? char.currentHp / stats.maxHp : 1;
  const hpDisplay = `${hpBar(char.currentHp, stats.maxHp)} **${char.currentHp}/${stats.maxHp}**${hpPct < 0.3 ? ' ⚠️' : ''}`;

  const embed = new EmbedBuilder()
    .setColor(hpPct < 0.3 ? 0xFF6B35 : 0xE74C3C)
    .setTitle(`⚔️ Dungeons — ${loc.emoji} ${loc.name}`);

  if (hpPct < 0.3) {
    embed.addFields({ name: '⚠️ HP CRÍTICO — Cuidado!', value: 'Seu HP está muito baixo. Considere ir à **🏰 Cidade → 🏥 Curar HP** antes de batalhar.', inline: false });
  }

  embed.addFields(
    { name: '👹 Inimigos da Região', value: enemyList, inline: false },
    { name: '💀 Bosses', value: bossList, inline: false },
    { name: '🔮 Tipos de Dungeon', value: '> Use o **2º menu** abaixo para escolher um tipo especial com bônus de XP/Ouro (Fogo, Gelo, Sombra, Trovão, Abissal)', inline: false },
    { name: '❤️ HP', value: hpDisplay, inline: true },
    { name: '⚡ Energia', value: `**${char.currentEnergy}/${stats.maxEnergy}**`, inline: true },
    { name: '⏱️ Cooldown', value: cd.onCooldown ? `🔴 ${cd.remaining}` : '🟢 Pronto!', inline: true },
  );

  return embed.setFooter({ text: '⚔️ Selecione um inimigo normal OU escolha um Tipo de Dungeon para bônus especiais de XP/Ouro!' });
}

export function buildDungeonSelect(char: FullCharacter): ActionRowBuilder<StringSelectMenuBuilder> | null {
  const loc = getLocation(char.currentLocation);
  if (loc.isSafeZone || !loc.hasDungeon) return null;

  const enemies = getEnemiesForLocation(loc.id, char.level);
  const bosses  = getBossesForLocation(loc.id).filter(b => char.level >= b.minLevel);
  const all = [...enemies.slice(0, 20), ...bosses];
  if (all.length === 0) return null;

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('rpg_select:dungeon_inimigo')
      .setPlaceholder('Escolha o inimigo para batalhar...')
      .addOptions(
        all.map(e =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`${e.name}${e.type === 'boss' ? ' [BOSS]' : e.type === 'elite' ? ' [Elite]' : ''}`)
            .setValue(e.id)
            .setEmoji(e.emoji.trim())
            .setDescription(`HP: ${e.baseHp} | ATK: ${e.baseAttack} | ${e.xpReward} XP | ${e.goldMin}~${e.goldMax}💰`)
        )
      )
  );
}

export function buildDungeonButtons(char: FullCharacter): ActionRowBuilder<ButtonBuilder> {
  const loc = getLocation(char.currentLocation);
  const enemies = getEnemiesForLocation(loc.id, char.level);
  const bosses  = getBossesForLocation(loc.id).filter(b => char.level >= b.minLevel);
  const hasEnemies = enemies.length > 0 || bosses.length > 0;
  const cd = isDungeonOnCooldown(char, 5);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('rpg:dungeon_aleatorio').setLabel('⚡ Batalha Rápida').setStyle(ButtonStyle.Danger).setDisabled(!hasEnemies || cd.onCooldown || char.currentHp <= 0),
    new ButtonBuilder().setCustomId('rpg:dungeon_boss').setLabel('💀 Boss').setStyle(ButtonStyle.Danger).setDisabled(bosses.length === 0 || cd.onCooldown || char.currentHp <= 0),
    new ButtonBuilder().setCustomId('rpg:dungeon').setLabel('🔄 Atualizar').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏰 Cidade').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Perfil').setStyle(ButtonStyle.Secondary),
  );
}

export async function doBattleRandom(char: FullCharacter, guildId?: string): Promise<{ embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] }> {
  const loc = getLocation(char.currentLocation);
  const enemies = getEnemiesForLocation(loc.id, char.level);
  if (enemies.length === 0) {
    return {
      embed: new EmbedBuilder().setColor(0xE74C3C).setTitle('Sem Inimigos').setDescription('Nenhum inimigo encontrado aqui no seu nível.'),
      rows: [buildDungeonButtons(char)],
    };
  }

  const enemy = enemies[Math.floor(Math.random() * enemies.length)];
  const result = await runCombat(char, enemy, false, guildId);
  return buildCombatResultEmbed(result, char);
}

export async function doBattleEnemy(char: FullCharacter, enemyId: string, guildId?: string): Promise<{ embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] }> {
  const enemy = getEnemy(enemyId);
  if (!enemy) {
    return {
      embed: new EmbedBuilder().setColor(0xE74C3C).setTitle('Erro').setDescription('Inimigo não encontrado.'),
      rows: [],
    };
  }
  const result = await runCombat(char, enemy, true); // usa habilidade divina
  return buildCombatResultEmbed(result, char);
}

function buildCombatResultEmbed(result: Awaited<ReturnType<typeof runCombat>>, char: FullCharacter): { embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] } {
  const color = result.result === 'vitoria' ? 0x27AE60 : result.result === 'derrota' ? 0xE74C3C : 0xF39C12;
  const title = result.result === 'vitoria' ? '🏆 Vitória!' : result.result === 'derrota' ? '💀 Derrota!' : '💥 Empate!';

  // trunca o log para caber no embed (max 4096 chars)
  const fullLog = result.log.join('\n');
  const logSlice = fullLog.length > 1800 ? '...\n' + fullLog.slice(-1600) : fullLog;

  // Barra de HP após o combate
  const stats = computeStats(char);
  const hpPct = stats.maxHp > 0 ? result.playerHpLeft / stats.maxHp : 0;
  const hpBarStr = hpBar(result.playerHpLeft, stats.maxHp);
  const hpCritical = hpPct < 0.3 && result.playerHpLeft > 0;
  const hpStatus = hpCritical ? ' ⚠️ **HP CRÍTICO!**' : (result.playerHpLeft <= 0 ? ' 💀 Derrotado' : '');

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(logSlice)
    .addFields(
      { name: '⭐ XP Ganho',  value: `+**${result.xpGained}**`,   inline: true },
      { name: '💰 Ouro Ganho', value: `+**${result.goldGained}**`, inline: true },
      {
        name: `❤️ HP Restante${hpStatus}`,
        value: `${hpBarStr} **${result.playerHpLeft}/${stats.maxHp}**`,
        inline: false,
      },
      { name: '⚡ Energia Restante', value: `**${result.playerEnergyLeft}/${stats.maxEnergy}**`, inline: true },
    );

  if (result.itemsDropped.length > 0) {
    const dropText = result.itemsDropped.map(id => {
      const item = getItem(id);
      return item ? `${item.emoji} **${item.name}**` : id;
    }).join('  •  ');
    embed.addFields({ name: `🎁 ${result.itemsDropped.length} Item(ns) Obtido(s)!`, value: dropText });
  }

  // Aplicar template customizável (se existir)
  const tplKey = result.result === 'vitoria' ? 'combat.victory' : result.result === 'derrota' ? 'combat.defeat' : 'combat.draw';
  applyTemplate(embed, tplKey);

  const combatBtns = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('rpg:dungeon_aleatorio')
      .setLabel('⚡ Batalhar Novamente')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(result.playerHpLeft <= 0),
    ...(hpCritical
      ? [new ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏥 Ir se Curar!').setStyle(ButtonStyle.Success)]
      : [new ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Escolher Inimigo').setStyle(ButtonStyle.Secondary)]
    ),
    new ButtonBuilder().setCustomId('rpg:perfil').setLabel('👤 Perfil').setStyle(ButtonStyle.Secondary),
  );

  const rows = [combatBtns];
  return { embed, rows };
}
