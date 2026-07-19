import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} from 'discord.js';
import { FullCharacter, computeStats } from '../services/character';
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

  return new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle(`⚔️ Dungeons — ${loc.emoji} ${loc.name}`)
    .addFields(
      { name: '👹 Inimigos da Região', value: enemyList, inline: false },
      { name: '💀 Bosses', value: bossList, inline: false },
      { name: '❤️ Seu HP', value: `**${char.currentHp}/${stats.maxHp}**`, inline: true },
      { name: '⚡ Energia', value: `**${char.currentEnergy}/${stats.maxEnergy}**`, inline: true },
      { name: '⏱️ Cooldown', value: cd.onCooldown ? `🔴 ${cd.remaining}` : '🟢 Pronto!', inline: true },
    )
    .setFooter({ text: 'Selecione o inimigo para batalhar. Bosses dão muito mais recompensa!' });
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
    new ButtonBuilder().setCustomId('rpg:dungeon_boss').setLabel('💀 Enfrentar Boss').setStyle(ButtonStyle.Danger).setDisabled(bosses.length === 0 || cd.onCooldown || char.currentHp <= 0),
    new ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(ButtonStyle.Secondary),
  );
}

export async function doBattleRandom(char: FullCharacter): Promise<{ embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] }> {
  const loc = getLocation(char.currentLocation);
  const enemies = getEnemiesForLocation(loc.id, char.level);
  if (enemies.length === 0) {
    return {
      embed: new EmbedBuilder().setColor(0xE74C3C).setTitle('Sem Inimigos').setDescription('Nenhum inimigo encontrado aqui no seu nível.'),
      rows: [buildDungeonButtons(char)],
    };
  }

  const enemy = enemies[Math.floor(Math.random() * enemies.length)];
  const result = await runCombat(char, enemy);
  return buildCombatResultEmbed(result, char);
}

export async function doBattleEnemy(char: FullCharacter, enemyId: string): Promise<{ embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] }> {
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

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(logSlice)
    .addFields(
      { name: '⭐ XP Ganho',        value: `+**${result.xpGained}**`,       inline: true },
      { name: '💰 Ouro Ganho',      value: `+**${result.goldGained}**`,     inline: true },
      { name: '❤️ HP Restante',     value: `**${result.playerHpLeft}**`,    inline: true },
      { name: '⚡ Energia Restante', value: `**${result.playerEnergyLeft}**`, inline: true },
    );

  if (result.itemsDropped.length > 0) {
    embed.addFields({ name: '🎁 Itens Obtidos', value: result.itemsDropped.map(id => getItem(id)?.name ?? id).join(', ') });
  }

  // Aplicar template customizável (se existir)
  const tplKey = result.result === 'vitoria' ? 'combat.victory' : result.result === 'derrota' ? 'combat.defeat' : 'combat.draw';
  applyTemplate(embed, tplKey);

  const rows = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('rpg:dungeon_aleatorio').setLabel('⚡ Batalhar Novamente').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('rpg:dungeon').setLabel('◀ Dungeons').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('rpg:perfil').setLabel('👤 Perfil').setStyle(ButtonStyle.Secondary),
    ),
  ];

  return { embed, rows };
}
