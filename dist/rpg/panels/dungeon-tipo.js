"use strict";
// ═══════════════════════════════════════════════════════════════════════
// DUNGEON POR TIPO — Seleção de tipo + combate com modificadores
// ═══════════════════════════════════════════════════════════════════════
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDungeonTypeEmbed = buildDungeonTypeEmbed;
exports.buildDungeonTypeSelect = buildDungeonTypeSelect;
exports.buildDungeonTypeButtons = buildDungeonTypeButtons;
exports.doBattleWithType = doBattleWithType;
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const character_1 = require("../services/character");
const dungeon_types_1 = require("../constants/dungeon-types");
const locations_1 = require("../constants/locations");
const enemies_1 = require("../constants/enemies");
const day_night_1 = require("../services/day-night");
const combat_1 = require("../services/combat");
function buildDungeonTypeEmbed(char) {
    const loc = (0, locations_1.getLocation)(char.currentLocation);
    const stats = (0, character_1.computeStats)(char);
    const phase = (0, day_night_1.getDayPhase)();
    const phaseInfo = day_night_1.PHASE_INFO[phase];
    if (loc.isSafeZone || !loc.hasDungeon) {
        return new discord_js_1.EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('⚔️ Tipos de Dungeon')
            .setDescription('Você está em uma zona segura. Viaje para uma região com dungeon!');
    }
    const availableTypes = dungeon_types_1.DUNGEON_TYPE_LIST.filter(t => char.level >= t.minLevel);
    return new discord_js_1.EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle(`⚔️ Dungeon Avançada — ${loc.emoji} ${loc.name}`)
        .setDescription(`Escolha o **tipo de dungeon** para uma experiência diferente!\nCada tipo tem **efeitos especiais** e multiplicadores de XP/Ouro únicos.\n\n` +
        `${phaseInfo.emoji} **${phaseInfo.name}**: ${phaseInfo.xpBonus > 0 ? `+${Math.round(phaseInfo.xpBonus * 100)}% XP adicional` : phaseInfo.desc}`)
        .addFields({
        name: '🎯 Tipos Disponíveis',
        value: availableTypes.map(t => `${t.emoji} **${t.name}** (Nv.${t.minLevel}+) — ${t.specialEffect}\n` +
            `> XP: ×${t.xpMult} | Ouro: ×${t.goldMult} | Inimigos: ×${t.enemyHpMult} HP`).join('\n\n'),
        inline: false,
    }, { name: '❤️ HP', value: `${(0, character_1.hpBar)(char.currentHp, stats.maxHp)} **${char.currentHp}/${stats.maxHp}**`, inline: true }, { name: '⚡ Energia', value: `**${char.currentEnergy}/${stats.maxEnergy}**`, inline: true })
        .setFooter({ text: '⚔️ Dungeons de tipo especial dão muito mais recompensa!' });
}
function buildDungeonTypeSelect(char) {
    const availableTypes = dungeon_types_1.DUNGEON_TYPE_LIST.filter(t => char.level >= t.minLevel);
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:dungeon_tipo_escolher')
        .setPlaceholder('Escolha o tipo de dungeon...')
        .addOptions(availableTypes.map(t => new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel(`${t.emoji} ${t.name}`)
        .setValue(t.id)
        .setDescription(`XP ×${t.xpMult} | Ouro ×${t.goldMult} | ${t.specialEffect.slice(0, 50)}`))));
}
function buildDungeonTypeButtons() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Dungeon Normal').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary));
}
// ─── Combate com tipo de dungeon ──────────────────────────────────────────────
async function doBattleWithType(char, dungeonTypeId, useRandom = true, enemyId) {
    const dungeonType = (0, dungeon_types_1.getDungeonType)(dungeonTypeId);
    const loc = (0, locations_1.getLocation)(char.currentLocation);
    const stats = (0, character_1.computeStats)(char);
    const phase = (0, day_night_1.getDayPhase)();
    const phaseInfo = day_night_1.PHASE_INFO[phase];
    // Escolher inimigo
    let baseEnemy = useRandom
        ? (() => { const list = (0, enemies_1.getEnemiesForLocation)(loc.id, char.level); return list[Math.floor(Math.random() * list.length)]; })()
        : (0, enemies_1.getEnemiesForLocation)(loc.id, char.level).find(e => e.id === enemyId) ?? (0, enemies_1.getEnemiesForLocation)(loc.id, char.level)[0];
    if (!baseEnemy) {
        return {
            embed: new discord_js_1.EmbedBuilder().setColor(0xFF0000).setTitle('Sem Inimigos').setDescription('Nenhum inimigo disponível aqui neste nível.'),
            rows: [],
        };
    }
    const enemy = (0, enemies_1.scaleEnemy)(baseEnemy, char.level);
    // Aplicar multiplicador do tipo de dungeon
    let enemyHp = Math.round(enemy.baseHp * dungeonType.enemyHpMult * (phaseInfo.enemyMult));
    const enemyAtk = Math.round(enemy.baseAttack * dungeonType.enemyAtkMult * phaseInfo.enemyMult);
    const log = [];
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
        }
        else {
            // Ataque do jogador
            const critBonus = dungeonType.critBonus;
            const isCrit = Math.random() < (stats.critChance / 100 + critBonus);
            let dmg = Math.max(1, stats.attack - Math.floor(enemy.baseDefense * 0.4));
            if (isCrit) {
                dmg = Math.round(dmg * (dungeonType.id === 'trovao' ? 1.5 : 1.3));
            }
            enemyHp = Math.max(0, enemyHp - dmg);
            log.push(`⚔️ Você causa **${dmg}**${isCrit ? ' 💥 CRÍTICO!' : ''}`);
        }
        if (enemyHp <= 0)
            break;
        // Ataque do inimigo
        const dodge = Math.random() * 100 < stats.dodgeChance;
        if (dodge) {
            log.push(`💨 Você esquivou!`);
        }
        else {
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
    const itemsDropped = [];
    if (won) {
        xpGained = Math.round(enemy.xpReward * dungeonType.xpMult * (1 + phaseInfo.xpBonus));
        goldGained = Math.round((Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1)) + enemy.goldMin) * dungeonType.goldMult * (1 + phaseInfo.goldBonus));
        // Drop de itens
        for (const drop of (enemy.dropTable ?? [])) {
            if (Math.random() * 100 < (drop.chance * (1 + dungeonType.dropRarityBonus))) {
                itemsDropped.push(drop.itemId);
                await (0, combat_1.giveItem)(char.discordId, drop.itemId, 1).catch(() => null);
            }
        }
    }
    await client_1.prisma.rpgCharacter.update({
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
        await client_1.prisma.rpgCharacter.update({ where: { discordId: char.discordId }, data: { xp: { increment: xpGained } } });
    }
    const color = won ? dungeonType.color : 0x555555;
    const title = won
        ? `${dungeonType.emoji} Vitória na Dungeon ${dungeonType.name}!`
        : `💀 Derrota na Dungeon ${dungeonType.name}`;
    const logSlice = log.slice(-12).join('\n');
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(logSlice)
        .addFields({ name: '⭐ XP', value: won ? `+**${xpGained}**` : '—', inline: true }, { name: '💰 Ouro', value: won ? `+**${goldGained}**` : '—', inline: true }, { name: `❤️ HP Restante`, value: `**${playerHp}/${stats.maxHp}**`, inline: true });
    if (itemsDropped.length) {
        const { getItem } = await Promise.resolve().then(() => __importStar(require('../constants/items')));
        embed.addFields({ name: '🎁 Drop!', value: itemsDropped.map(id => getItem(id)?.name ?? id).join(', ') });
    }
    const rows = [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`rpg:dungeon_tipo`).setLabel(`${dungeonType.emoji} Repetir ${dungeonType.name}`).setStyle(discord_js_1.ButtonStyle.Danger).setDisabled(playerHp <= 0), new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Dungeon Normal').setStyle(discord_js_1.ButtonStyle.Secondary), ...(playerHp <= 0 ? [new discord_js_1.ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏥 Curar').setStyle(discord_js_1.ButtonStyle.Success)] : []), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('👤 Perfil').setStyle(discord_js_1.ButtonStyle.Secondary)),
    ];
    return { embed, rows };
}
//# sourceMappingURL=dungeon-tipo.js.map