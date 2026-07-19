// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE PERFIL RPG — replica a imagem fornecida
// ═══════════════════════════════════════════════════════════════════════

import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} from 'discord.js';
import { FullCharacter, computeStats, hpBar, xpBar, ComputedStats } from '../services/character';
import { getClass, karmaLabel, rpgXpForLevel } from '../constants/classes';
import { getItem, SLOT_NAME, SLOT_EMOJI } from '../constants/items';
import { getLocation, ENV_EMOJI } from '../constants/locations';
import { DIVINE_SKILLS } from '../constants/skills';

// ─── Embed de perfil principal ─────────────────────────────────────────────

export function buildProfileEmbed(char: FullCharacter, stats: ComputedStats): EmbedBuilder {
  const cls = getClass(char.class);
  const loc = getLocation(char.currentLocation);
  const envLabel = ENV_EMOJI[char.environment] ?? char.environment;
  const eq = char.equipment;

  // Habilidade divina
  let divineText = '*Nenhuma habilidade divina ainda*';
  if (char.divineSkillId) {
    const ds = DIVINE_SKILLS[char.divineSkillId];
    if (ds) {
      divineText = `${ds.emoji} **${ds.name}** [Rank ${char.divineSkillRank}]\n*${ds.description}*`;
    }
  }

  // Slots de equipamento (visual)
  const slotDisplay = (itemId: string | null | undefined, slotName: string) => {
    if (!itemId) return `\`${slotName.padEnd(7)}\` ──`;
    const item = getItem(itemId);
    return `\`${slotName.padEnd(7)}\` ${item?.emoji ?? '❓'} ${item?.name ?? itemId}`;
  };

  const embed = new EmbedBuilder()
    .setColor(cls?.color ?? 0x5865F2)
    .setTitle(`${cls?.emoji ?? '⚔️'} ${char.username} — Nível ${char.level} ${cls?.name ?? char.class}`)
    .setDescription(
      [
        `> "*${cls?.name ?? char.class}*" • Karma: **${karmaLabel(char.karma)}** • GEN. ${char.generation}`,
        '',
        `${xpBarDisplay(char)} **${char.xp}/${rpgXpForLevel(char.level)} XP** (${Math.round(char.xp/rpgXpForLevel(char.level)*100)}%)`,
        `❤️ HP:     ${hpBar(char.currentHp, stats.maxHp)}  **${char.currentHp}/${stats.maxHp}**`,
        `⚡ Energia: ${hpBar(char.currentEnergy, stats.maxEnergy)}  **${char.currentEnergy}/${stats.maxEnergy}**`,
      ].join('\n')
    )
    .addFields(
      // ── Linha 1: Localização + Poder de Combate ───────────────────────────
      {
        name: '📍 Localização',
        value: `${loc.emoji} **${loc.name}**\n${envLabel}`,
        inline: true,
      },
      {
        name: '⚔️ Poder de Combate',
        value: `# ${stats.combatPower.toLocaleString('pt-BR')}`,
        inline: true,
      },
      {
        name: '💰 Ouro',
        value: `**${char.gold.toLocaleString('pt-BR')}**`,
        inline: true,
      },

      // ── Atributos de combate ──────────────────────────────────────────────
      {
        name: '📊 Atributos de Combate',
        value: [
          `\`FOR\` **${stats.str}**   \`AGI\` **${stats.agi}**   \`INT\` **${stats.int}**   \`VIT\` **${stats.vit}**   \`SOR\` **${stats.lck}**`,
          ``,
          `⚔️ Ataque:  **${stats.attack}**     🛡️ Defesa: **${stats.defense}**`,
          `💥 Crítico: **${stats.critChance.toFixed(1)}%**   💨 Esquiva: **${stats.dodgeChance.toFixed(1)}%**`,
        ].join('\n'),
        inline: true,
      },

      // ── Equipamento atual ─────────────────────────────────────────────────
      {
        name: '🎽 Equipamento Atual',
        value: eq ? [
          slotDisplay(eq.helmet,  '⛑️ Elmo'),
          slotDisplay(eq.weapon,  '⚔️ Arma'),
          slotDisplay(eq.shield,  '🛡️ Escudo'),
          slotDisplay(eq.pants,   '👖 Calças'),
          slotDisplay(eq.boots,   '👟 Botas'),
          slotDisplay(eq.gloves,  '🧤 Luvas'),
          slotDisplay(eq.ring,    '💍 Anel'),
          slotDisplay(eq.backpack,'🎒 Mochila'),
          slotDisplay(eq.pet,     '🐾 Pet'),
        ].join('\n') : '*Sem equipamento*',
        inline: true,
      },

      // ── Habilidade Divina ─────────────────────────────────────────────────
      {
        name: '✨ Habilidade Divina',
        value: divineText,
        inline: false,
      },

      // ── Stats de batalha ──────────────────────────────────────────────────
      {
        name: '📈 Histórico de Batalhas',
        value: [
          `🏆 Vitórias: **${char.totalWins}**   💀 Mortes: **${char.totalDeaths}**`,
          `⚔️ PvP: **${char.pvpWins}W/${char.pvpLosses}L**   👹 Bosses: **${char.bossKills}**`,
        ].join('\n'),
        inline: false,
      },
    )
    .setFooter({ text: `⚔️ Aliança Skyline RPG • Reencarnado em: ${char.createdAt.toISOString().slice(0,10)}` })
    .setTimestamp();

  return embed;
}

// ─── Botões do perfil (igual à imagem: Atualizar, Viajar, Inventário, Pontos) ─

export function buildProfileButtons(char: FullCharacter): ActionRowBuilder<ButtonBuilder>[] {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('rpg:perfil').setLabel('🔄 Atualizar').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rpg:viajar').setLabel('🗺️ Viajar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('rpg:inventario').setLabel('🎒 Inventário').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`rpg:pontos`).setLabel(`⭐ Pontos (${char.statPoints})`).setStyle(char.statPoints > 0 ? ButtonStyle.Danger : ButtonStyle.Secondary).setDisabled(char.statPoints === 0),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏰 Cidade').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Dungeon').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('rpg:habilidades').setLabel('✨ Habilidades').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('rpg:guild').setLabel('🏛️ Guilda').setStyle(ButtonStyle.Secondary),
  );

  return [row1, row2];
}

// ─── Embed da cidade (hub central) ────────────────────────────────────────────

export function buildCidadeEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('🏰 Cidade da Aliança')
    .setDescription('Bem-vindo ao coração da Aliança Skyline! O que deseja fazer?')
    .addFields(
      { name: '🛒 Loja',      value: 'Compre equipamentos e consumíveis', inline: true },
      { name: '⚒️ Forja',     value: 'Crie itens com materiais',          inline: true },
      { name: '🏥 Curandeiro', value: 'Restaure HP e Energia',            inline: true },
      { name: '📋 Missões',    value: 'Missões RPG diárias',              inline: true },
      { name: '🏛️ Guilda',    value: 'Gerenciar sua guilda',              inline: true },
      { name: '⚔️ Arena PvP', value: 'Desafie outros jogadores',          inline: true },
    )
    .setFooter({ text: '⚔️ Aliança Skyline RPG' });
}

export function buildCidadeButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('rpg:loja').setLabel('🛒 Loja').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('rpg:forja').setLabel('⚒️ Forja').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rpg:curandeiro').setLabel('🏥 Curar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('rpg:arena').setLabel('⚔️ Arena PvP').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(ButtonStyle.Secondary),
  );
}

// ─── Distribuir pontos de atributo ────────────────────────────────────────────

export function buildPontosEmbed(char: FullCharacter, stats: ComputedStats): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xF1C40F)
    .setTitle('⭐ Distribuir Pontos de Atributo')
    .setDescription(`Você tem **${char.statPoints}** ponto(s) disponível(is) para distribuir.`)
    .addFields(
      { name: '💪 FOR (Força)',       value: `${stats.str} → aumenta Ataque`,   inline: true },
      { name: '🏃 AGI (Agilidade)',   value: `${stats.agi} → aumenta Esquiva e Crítico`, inline: true },
      { name: '🧠 INT (Inteligência)',value: `${stats.int} → aumenta Magia`,    inline: true },
      { name: '❤️ VIT (Vitalidade)',  value: `${stats.vit} → aumenta HP`,       inline: true },
      { name: '🍀 SOR (Sorte)',       value: `${stats.lck} → aumenta Sorte/Ouro`, inline: true },
    )
    .setFooter({ text: 'Selecione o atributo e a quantidade' });
}

export function buildPontosSelect(statPoints: number): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('rpg_select:distribuir_stat')
      .setPlaceholder('Escolha o atributo para adicionar 1 ponto')
      .setDisabled(statPoints === 0)
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('💪 Força (FOR)').setValue('strength').setDescription('Aumenta ataque físico'),
        new StringSelectMenuOptionBuilder().setLabel('🏃 Agilidade (AGI)').setValue('agility').setDescription('Aumenta esquiva e crítico'),
        new StringSelectMenuOptionBuilder().setLabel('🧠 Inteligência (INT)').setValue('intelligence').setDescription('Aumenta poder mágico'),
        new StringSelectMenuOptionBuilder().setLabel('❤️ Vitalidade (VIT)').setValue('vitality').setDescription('Aumenta HP máximo'),
        new StringSelectMenuOptionBuilder().setLabel('🍀 Sorte (SOR)').setValue('luck').setDescription('Aumenta sorte e ouro'),
      )
  );
}

// ─── Helper barra de XP ───────────────────────────────────────────────────────

function xpBarDisplay(char: FullCharacter): string {
  const needed = rpgXpForLevel(char.level);
  const pct = Math.min(1, char.xp / needed);
  const filled = Math.round(pct * 10);
  return '`' + '█'.repeat(filled) + '░'.repeat(10 - filled) + '`';
}
