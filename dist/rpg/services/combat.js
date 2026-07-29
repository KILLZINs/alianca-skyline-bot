"use strict";
// ═══════════════════════════════════════════════════════════════════════
// ENGINE DE COMBATE RPG
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
exports.runCombat = runCombat;
exports.runPvp = runPvp;
exports.giveItem = giveItem;
exports.isDungeonOnCooldown = isDungeonOnCooldown;
exports.isTravelOnCooldown = isTravelOnCooldown;
const client_1 = require("../../database/client");
const character_1 = require("./character");
const enemies_1 = require("../constants/enemies");
const items_1 = require("../constants/items");
const skills_1 = require("../constants/skills");
// ─── Combate principal ─────────────────────────────────────────────────────
async function runCombat(char, enemy, useSkill = false, guildId) {
    const stats = (0, character_1.computeStats)(char);
    const scaledEnemy = (0, enemies_1.scaleEnemy)(enemy, char.level);
    const state = {
        playerHp: char.currentHp,
        playerEnergy: char.currentEnergy,
        enemyHp: scaledEnemy.baseHp,
        round: 0,
        log: [],
        usedSkillThisRound: false,
        berserkActive: 0, shieldActive: 0,
        doubleDmgNextHit: false,
        poisonRounds: 0, frozenRounds: 0, stubbedRounds: 0,
    };
    const MAX_ROUNDS = 20;
    state.log.push(`⚔️ **${char.username}** (Lv.${char.level} ${char.class}) vs **${enemy.name}** ${enemy.emoji}`);
    state.log.push(`❤️ Seus HP: **${state.playerHp}/${stats.maxHp}** | HP inimigo: **${state.enemyHp}**`);
    state.log.push('');
    while (state.round < MAX_ROUNDS && state.playerHp > 0 && state.enemyHp > 0) {
        state.round++;
        state.log.push(`**— Rodada ${state.round} —**`);
        // ── Seu turno ──────────────────────────────────────────────────────────
        if (state.frozenRounds > 0) {
            state.log.push(`❄️ Você está congelado! Não pode atacar.`);
            state.frozenRounds--;
        }
        else {
            const playerDmg = calcPlayerDamage(char, stats, state, scaledEnemy, useSkill && state.round === 1);
            state.enemyHp = Math.max(0, state.enemyHp - playerDmg.damage);
            state.log.push(playerDmg.msg);
        }
        if (state.enemyHp <= 0)
            break;
        // ── Turno do inimigo ───────────────────────────────────────────────────
        if (state.stubbedRounds > 0) {
            state.log.push(`😵 ${enemy.name} está atordoado!`);
            state.stubbedRounds--;
        }
        else {
            const enemyDmg = calcEnemyDamage(scaledEnemy, stats, state);
            state.playerHp = Math.max(0, state.playerHp - enemyDmg.damage);
            state.log.push(enemyDmg.msg);
        }
        // ── Efeitos de veneno ──────────────────────────────────────────────────
        if (state.poisonRounds > 0 && state.enemyHp > 0) {
            const poisonDmg = Math.max(1, Math.floor(stats.attack * 0.08));
            state.enemyHp = Math.max(0, state.enemyHp - poisonDmg);
            state.log.push(`☠️ Veneno causa **${poisonDmg}** de dano!`);
            state.poisonRounds--;
        }
        // status HP
        if (state.playerHp > 0 && state.enemyHp > 0) {
            state.log.push(`> ❤️ Seu HP: **${state.playerHp}** | HP inimigo: **${state.enemyHp}**`);
        }
    }
    // ── Determinar resultado ───────────────────────────────────────────────────
    let result = 'empate';
    let xpGained = 0;
    let goldGained = 0;
    const itemsDropped = [];
    if (state.playerHp <= 0 && state.enemyHp <= 0) {
        result = 'empate';
        state.log.push(`\n💥 **EMPATE!** Ambos caíram ao mesmo tempo!`);
        xpGained = Math.floor(scaledEnemy.xpReward * 0.3);
        goldGained = Math.floor(scaledEnemy.goldMin * 0.5);
    }
    else if (state.enemyHp <= 0) {
        result = 'vitoria';
        state.log.push(`\n🏆 **VITÓRIA!** ${enemy.name} foi derrotado!`);
        // calcular recompensas (com multiplicadores de eventos de mundo)
        const { getEventMultipliers } = await Promise.resolve().then(() => __importStar(require('../panels/world-events')));
        const worldMults = guildId ? await getEventMultipliers(guildId) : { xp: 1, gold: 1, dropBonus: 0, noEnergy: false, enemyMult: 1 };
        const goldBonus = (1 + (stats.goldBonus / 100)) * worldMults.gold;
        const xpBonus = (1 + ((stats.xpBonus) / 100)) * worldMults.xp;
        xpGained = Math.floor(scaledEnemy.xpReward * xpBonus);
        goldGained = Math.floor((scaledEnemy.goldMin + Math.random() * (scaledEnemy.goldMax - scaledEnemy.goldMin)) * goldBonus);
        if (worldMults.xp > 1)
            state.log.push(`⭐ Bônus de evento: **×${worldMults.xp} XP**!`);
        if (worldMults.gold > 1)
            state.log.push(`💰 Bônus de evento: **×${worldMults.gold} Ouro**!`);
        // drop de itens (com bônus de meteor)
        for (const drop of enemy.dropTable) {
            const roll = Math.random() * 100;
            if (roll < drop.chance + (worldMults.dropBonus * 100)) {
                itemsDropped.push(drop.itemId);
            }
        }
        if (itemsDropped.length > 0) {
            const names = itemsDropped.map(id => (0, items_1.getItem)(id)?.name ?? id).join(', ');
            state.log.push(`🎁 **Drops:** ${names}`);
        }
        state.log.push(`⭐ **+${xpGained} XP** | 💰 **+${goldGained} Ouro**`);
    }
    else {
        result = 'derrota';
        state.log.push(`\n💀 **DERROTA!** Você foi derrotado por ${enemy.name}...`);
        xpGained = Math.floor(scaledEnemy.xpReward * 0.05);
        goldGained = 0;
        state.log.push(`💫 +${xpGained} XP de consolação`);
    }
    // ── Salvar no banco ────────────────────────────────────────────────────────
    const newHp = result === 'derrota' ? Math.floor(stats.maxHp * 0.1) : state.playerHp;
    // Custo de energia por combate — base maior + crescimento mais rápido por rodada
    // blessing event: energia não é consumida
    const { getEventMultipliers: getMults } = await Promise.resolve().then(() => __importStar(require('../panels/world-events')));
    const blessingCheck = guildId ? await getMults(guildId) : { noEnergy: false };
    const energyCost = blessingCheck.noEnergy ? 0 : Math.min(state.playerEnergy, 25 + state.round * 3);
    if (blessingCheck.noEnergy)
        state.log.push('✨ **Bênção dos Antigos**: energia não consumida!');
    const finalEnergy = Math.max(0, state.playerEnergy - energyCost);
    await client_1.prisma.rpgCharacter.update({
        where: { discordId: char.discordId },
        data: {
            currentHp: Math.max(1, newHp),
            currentEnergy: finalEnergy,
            gold: { increment: goldGained },
            totalKills: result === 'vitoria' ? { increment: 1 } : undefined,
            totalDeaths: result === 'derrota' ? { increment: 1 } : undefined,
            totalWins: result === 'vitoria' ? { increment: 1 } : undefined,
            bossKills: (result === 'vitoria' && enemy.type === 'boss') ? { increment: 1 } : undefined,
            karma: enemy.karmaEffect ? { increment: enemy.karmaEffect } : undefined,
            lastDungeon: new Date(),
        },
    });
    if (xpGained > 0) {
        await (0, character_1.addRpgXp)(char, xpGained);
    }
    // ── XP de habilidade divina (toda batalha com XP ganho) ─────────────────────
    // XP maior se habilidade foi ativada; menor se batalhou sem ela
    if (xpGained > 0 && char.divineSkillId) {
        const skill = skills_1.DIVINE_SKILLS[char.divineSkillId];
        if (skill) {
            const SKILL_RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
            // Habilidade usada: 40% do XP (min 25); não usada: 10% (min 5)
            const skillXpGain = state.usedSkillThisRound
                ? Math.max(25, Math.floor(xpGained * 0.4))
                : Math.max(5, Math.floor(xpGained * 0.1));
            const newSkillExp = char.divineSkillExp + skillXpGain;
            const rankIdx = SKILL_RANKS.indexOf(char.divineSkillRank);
            // Multiplicador exponencial por rank — rank S exige 64× o valor base
            const RANK_MULT = [1, 2, 4, 8, 16, 32, 64, 128];
            const requiredXp = skill.rankUpExpRequired * (RANK_MULT[rankIdx] ?? 1);
            const canRankUp = rankIdx >= 0 && rankIdx < SKILL_RANKS.length - 1 && newSkillExp >= requiredXp;
            const newRank = canRankUp ? SKILL_RANKS[rankIdx + 1] : char.divineSkillRank;
            await client_1.prisma.rpgCharacter.update({
                where: { discordId: char.discordId },
                data: {
                    divineSkillExp: canRankUp ? 0 : newSkillExp,
                    divineSkillRank: newRank,
                },
            });
            const usedMark = state.usedSkillThisRound ? ' ✨' : '';
            state.log.push(`\n✨ **${skill.name}** +**${skillXpGain} XP** de habilidade${usedMark} (${canRankUp ? 0 : newSkillExp}/${requiredXp})`);
            if (canRankUp) {
                state.log.push(`🌟 **RANK UP!** ${skill.emoji} **${skill.name}** → Rank **${newRank}**! 🎊`);
            }
        }
    }
    // salvar drops no inventário
    for (const itemId of itemsDropped) {
        await giveItem(char.discordId, itemId, 1);
    }
    // salvar log
    await client_1.prisma.rpgCombatLog.create({
        data: {
            characterId: char.discordId,
            type: enemy.type === 'boss' ? 'boss' : 'dungeon',
            result,
            enemyName: enemy.name,
            xpGained, goldGained,
            itemsGained: itemsDropped,
            rounds: state.round,
            summary: state.log.slice(-3).join(' '),
        },
    });
    return {
        result, rounds: state.round, log: state.log,
        xpGained, goldGained, itemsDropped,
        playerHpLeft: Math.max(1, newHp),
        playerEnergyLeft: finalEnergy,
        bossKill: enemy.type === 'boss' && result === 'vitoria',
    };
}
// ─── PvP ──────────────────────────────────────────────────────────────────
async function runPvp(attacker, defender) {
    const atkStats = (0, character_1.computeStats)(attacker);
    const defStats = (0, character_1.computeStats)(defender);
    const log = [];
    log.push(`⚔️ **PvP:** ${attacker.username} (Lv.${attacker.level}) vs ${defender.username} (Lv.${defender.level})`);
    let atkHp = attacker.currentHp;
    let defHp = defender.currentHp;
    let round = 0;
    while (round < 15 && atkHp > 0 && defHp > 0) {
        round++;
        // atacante ataca
        const rawDmg = Math.max(1, atkStats.attack - defStats.defense * 0.5);
        const crit = Math.random() * 100 < atkStats.critChance;
        const dmg = Math.floor(crit ? rawDmg * 2 : rawDmg);
        defHp -= dmg;
        log.push(`Rd ${round}: ${attacker.username} causa **${dmg}**${crit ? ' 💥 CRÍTICO' : ''} | HP ${defender.username}: **${Math.max(0, defHp)}**`);
        if (defHp <= 0)
            break;
        // defensor contra-ataca
        const rawDmg2 = Math.max(1, defStats.attack - atkStats.defense * 0.5);
        const crit2 = Math.random() * 100 < defStats.critChance;
        const dmg2 = Math.floor(crit2 ? rawDmg2 * 2 : rawDmg2);
        atkHp -= dmg2;
        log.push(`Rd ${round}: ${defender.username} causa **${dmg2}**${crit2 ? ' 💥 CRÍTICO' : ''} | HP ${attacker.username}: **${Math.max(0, atkHp)}**`);
    }
    const attackerWon = defHp <= 0 || (atkHp > 0 && defHp > 0 && atkStats.combatPower > defStats.combatPower);
    const winner = attackerWon ? attacker : defender;
    const loser = attackerWon ? defender : attacker;
    const xpGained = Math.floor(loser.level * 15);
    const goldStolen = Math.floor(loser.gold * 0.05);
    log.push(`\n🏆 **${winner.username} venceu o PvP!** +${xpGained} XP | 💰 +${goldStolen} ouro`);
    await Promise.all([
        client_1.prisma.rpgCharacter.update({ where: { discordId: winner.discordId }, data: { pvpWins: { increment: 1 }, gold: { increment: goldStolen }, lastPvp: new Date() } }),
        client_1.prisma.rpgCharacter.update({ where: { discordId: loser.discordId }, data: { pvpLosses: { increment: 1 }, gold: { decrement: Math.min(goldStolen, loser.gold) }, lastPvp: new Date() } }),
        (0, character_1.addRpgXp)(winner, xpGained),
        client_1.prisma.rpgCombatLog.create({ data: { characterId: winner.discordId, type: 'pvp', result: 'vitoria', opponentId: loser.discordId, xpGained, goldGained: goldStolen, rounds: round } }),
        client_1.prisma.rpgCombatLog.create({ data: { characterId: loser.discordId, type: 'pvp', result: 'derrota', opponentId: winner.discordId, xpGained: 0, goldGained: 0, rounds: round } }),
    ]);
    return { winner: winner.discordId, loser: loser.discordId, log, xpGained, goldStolen };
}
// ─── Helpers internos ─────────────────────────────────────────────────────
function calcPlayerDamage(char, stats, state, enemy, useSkill) {
    let dmg = Math.max(1, stats.attack - Math.floor(enemy.baseDefense * 0.4));
    let msg = '';
    // skill divina no primeiro turno
    if (useSkill && char.divineSkillId && state.playerEnergy >= (skills_1.DIVINE_SKILLS[char.divineSkillId]?.energyCost ?? 999)) {
        const skill = skills_1.DIVINE_SKILLS[char.divineSkillId];
        if (skill && skill.type === 'ataque') {
            const eff = (0, skills_1.skillEffectValue)(skill, char.divineSkillRank);
            dmg = Math.floor(dmg * eff);
            state.playerEnergy -= skill.energyCost;
            state.usedSkillThisRound = true; // ← rastrear uso para conceder XP de habilidade
            msg = `✨ **${skill.name}** ${skill.emoji} — `;
        }
    }
    // bônus berserk
    if (state.berserkActive > 0) {
        dmg = Math.floor(dmg * 1.8);
        state.berserkActive--;
    }
    // crítico
    const isCrit = Math.random() * 100 < stats.critChance;
    if (isCrit) {
        dmg = Math.floor(dmg * 2.0);
    }
    // double hit passivo
    if (state.doubleDmgNextHit) {
        dmg *= 2;
        state.doubleDmgNextHit = false;
    }
    msg += `⚔️ Você causa **${dmg}** de dano${isCrit ? ' 💥 CRÍTICO!' : '.'}`;
    return { damage: dmg, msg };
}
function calcEnemyDamage(enemy, stats, state) {
    let dmg = Math.max(1, enemy.baseAttack - Math.floor(stats.defense * 0.5));
    // escudo ativo reduz dano
    if (state.shieldActive > 0) {
        dmg = Math.floor(dmg * 0.5);
        state.shieldActive--;
    }
    // esquiva
    if (Math.random() * 100 < stats.dodgeChance) {
        return { damage: 0, msg: `💨 Você esquivou do ataque de ${enemy.name}!` };
    }
    return { damage: dmg, msg: `💢 ${enemy.name} causa **${dmg}** de dano.` };
}
// ─── Dar item ao personagem ────────────────────────────────────────────────
async function giveItem(discordId, itemId, qty = 1) {
    return client_1.prisma.rpgInventoryItem.upsert({
        where: { characterId_itemId: { characterId: discordId, itemId } },
        update: { quantity: { increment: qty } },
        create: { characterId: discordId, itemId, quantity: qty },
    });
}
// ─── Verificar cooldown ────────────────────────────────────────────────────
function isDungeonOnCooldown(char, cooldownMin) {
    if (!char.lastDungeon)
        return { onCooldown: false, remaining: '' };
    const elapsed = Date.now() - char.lastDungeon.getTime();
    const cooldownMs = cooldownMin * 60 * 1000;
    if (elapsed >= cooldownMs)
        return { onCooldown: false, remaining: '' };
    const rem = cooldownMs - elapsed;
    const mins = Math.ceil(rem / 60000);
    return { onCooldown: true, remaining: `${mins} minuto(s)` };
}
function isTravelOnCooldown(char, cooldownMin) {
    if (!char.lastTravel)
        return { onCooldown: false, remaining: '' };
    const elapsed = Date.now() - char.lastTravel.getTime();
    const cooldownMs = cooldownMin * 60 * 1000;
    if (elapsed >= cooldownMs)
        return { onCooldown: false, remaining: '' };
    const rem = cooldownMs - elapsed;
    const mins = Math.ceil(rem / 60000);
    return { onCooldown: true, remaining: `${mins} minuto(s)` };
}
//# sourceMappingURL=combat.js.map