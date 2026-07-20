"use strict";
// ═══════════════════════════════════════════════════════════════════════
// SERVIÇO DE PERSONAGEM RPG
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateCharacter = getOrCreateCharacter;
exports.getCharacter = getCharacter;
exports.computeStats = computeStats;
exports.addRpgXp = addRpgXp;
exports.applyPassiveEnergyRegen = applyPassiveEnergyRegen;
exports.applyChatEnergyRegen = applyChatEnergyRegen;
exports.restoreHp = restoreHp;
exports.restoreEnergy = restoreEnergy;
exports.distributeStatPoints = distributeStatPoints;
exports.setClass = setClass;
exports.reincarnate = reincarnate;
exports.hpBar = hpBar;
exports.xpBar = xpBar;
const client_1 = require("../../database/client");
const classes_1 = require("../constants/classes");
const items_1 = require("../constants/items");
const skills_1 = require("../constants/skills");
// ─── Obter ou criar personagem ─────────────────────────────────────────────
async function getOrCreateCharacter(discordId, username) {
    let char = await client_1.prisma.rpgCharacter.findUnique({
        where: { discordId },
        include: { equipment: true },
    });
    if (!char) {
        char = await client_1.prisma.rpgCharacter.create({
            data: {
                discordId, username,
                equipment: { create: {} },
            },
            include: { equipment: true },
        });
    }
    return char;
}
async function getCharacter(discordId) {
    return client_1.prisma.rpgCharacter.findUnique({
        where: { discordId },
        include: { equipment: true },
    });
}
function computeStats(char) {
    const cls = (0, classes_1.getClass)(char.class) ?? classes_1.CLASSES['guerreiro'];
    const levelStats = (0, classes_1.calcLevelStats)(cls, char.level);
    // somar stats de equipamento
    let eqAttack = 0, eqDefense = 0, eqStr = 0, eqAgi = 0, eqInt = 0, eqVit = 0, eqLck = 0;
    let eqHp = 0, eqEnergy = 0, eqCrit = 0, eqDodge = 0, eqGold = 0, eqXp = 0;
    const eq = char.equipment;
    if (eq) {
        const slots = [eq.weapon, eq.helmet, eq.pants, eq.boots, eq.gloves, eq.shield, eq.ring, eq.amulet, eq.backpack, eq.pet];
        for (const itemId of slots) {
            if (!itemId)
                continue;
            const item = (0, items_1.getItem)(itemId);
            if (!item)
                continue;
            const s = item.stats;
            eqStr += s.str ?? 0;
            eqAgi += s.agi ?? 0;
            eqInt += s.int ?? 0;
            eqVit += s.vit ?? 0;
            eqLck += s.lck ?? 0;
            eqHp += s.hp ?? 0;
            eqEnergy += s.energy ?? 0;
            eqDefense += s.defense ?? 0;
            eqAttack += s.attack ?? 0;
            eqCrit += s.critBonus ?? 0;
            eqDodge += s.dodgeBonus ?? 0;
            eqGold += s.goldBonus ?? 0;
        }
    }
    // stats finais = base da classe por nível + bônus pessoais (statPoints gastos) + equipamento
    // BUG FIX: usar ?? 0 para evitar NaN quando a classe não existe no mapa
    const clsBase = classes_1.CLASSES[char.class]?.baseStats;
    const str = levelStats.str + char.strength - (clsBase?.str ?? 0) + eqStr;
    const agi = levelStats.agi + char.agility - (clsBase?.agi ?? 0) + eqAgi;
    const int = levelStats.int + char.intelligence - (clsBase?.int ?? 0) + eqInt;
    const vit = levelStats.vit + char.vitality - (clsBase?.vit ?? 0) + eqVit;
    const lck = levelStats.lck + char.luck - (clsBase?.lck ?? 0) + eqLck;
    const maxHp = cls.baseHp + (vit * cls.hpPerVit) + eqHp;
    const maxEnergy = cls.baseEnergy + (char.level * cls.energyPerLevel) + eqEnergy;
    const attack = (0, classes_1.calcAttack)({ str, agi, int, vit, lck }, cls.primaryStat) + eqAttack;
    const defense = (0, classes_1.calcDefense)(vit, eqDefense);
    const critChance = Math.round(((0, classes_1.calcCritChance)(agi, lck) + eqCrit) * 10) / 10;
    const dodgeChance = Math.round(((0, classes_1.calcDodge)(agi, lck) + eqDodge) * 10) / 10;
    const combatPower = (0, classes_1.calcCombatPower)({ str, agi, int, vit, lck }, char.level, eqAttack + eqDefense);
    // bônus de habilidade divina passiva
    let passGold = eqGold, passXp = eqXp;
    if (char.divineSkillId) {
        const skill = skills_1.DIVINE_SKILLS[char.divineSkillId];
        if (skill?.passive) {
            passGold += skill.passive.goldBonus ?? 0;
            passXp += skill.passive.xpBonus ?? 0;
        }
    }
    return {
        str, agi, int, vit, lck,
        attack, defense, critChance, dodgeChance, combatPower,
        maxHp, maxEnergy,
        equipAttackBonus: eqAttack,
        equipDefenseBonus: eqDefense,
        goldBonus: passGold,
        xpBonus: passXp,
    };
}
// ─── XP e Level Up ────────────────────────────────────────────────────────
async function addRpgXp(char, xpGained) {
    let { xp, level } = char;
    xp += xpGained;
    let leveledUp = false;
    while (xp >= (0, classes_1.rpgXpForLevel)(level)) {
        xp -= (0, classes_1.rpgXpForLevel)(level);
        level++;
        leveledUp = true;
    }
    // ao subir de nível, ganha pontos de stat e skill
    const statPoints = leveledUp ? char.statPoints + (level - char.level) * 3 : char.statPoints;
    const skillPoints = leveledUp ? char.skillPoints + (level - char.level) : char.skillPoints;
    // recalcular HP/energia máximos
    const cls = (0, classes_1.getClass)(char.class) ?? classes_1.CLASSES['guerreiro'];
    const newLevelStats = (0, classes_1.calcLevelStats)(cls, level);
    const newMaxHp = cls.baseHp + (newLevelStats.vit * cls.hpPerVit);
    const newMaxEnergy = cls.baseEnergy + (level * cls.energyPerLevel);
    const updated = await client_1.prisma.rpgCharacter.update({
        where: { discordId: char.discordId },
        data: {
            xp, level, statPoints, skillPoints,
            maxHp: newMaxHp, maxEnergy: newMaxEnergy,
            currentHp: Math.min(char.currentHp + (leveledUp ? newMaxHp : 0), newMaxHp),
        },
        include: { equipment: true },
    });
    return { char: updated, leveledUp, newLevel: level };
}
// ─── Regen passiva de energia (tempo + chat) ──────────────────────────────
/** Chamado ao exibir painéis RPG — recupera energia acumulada passivamente.
 *  Taxa: 1 ponto a cada 3 minutos, máximo = maxEnergy calculado. */
async function applyPassiveEnergyRegen(char) {
    const stats = computeStats(char);
    if (char.currentEnergy >= stats.maxEnergy)
        return char; // já cheio
    const now = Date.now();
    const lastTick = char.lastEnergyTick?.getTime() ?? char.createdAt.getTime();
    const minutes = (now - lastTick) / 60000;
    const gained = Math.floor(minutes / 3); // 1 energia a cada 3 min
    if (gained <= 0)
        return char;
    const newEnergy = Math.min(char.currentEnergy + gained, stats.maxEnergy);
    return client_1.prisma.rpgCharacter.update({
        where: { discordId: char.discordId },
        data: { currentEnergy: newEnergy, lastEnergyTick: new Date() },
        include: { equipment: true },
    });
}
/** Chamado no messageCreate — regen leve via conversa no chat.
 *  +1 energia por mensagem (cooldown 5 min por usuário). */
const _chatEnergyCooldowns = new Map();
async function applyChatEnergyRegen(discordId) {
    const now = Date.now();
    const last = _chatEnergyCooldowns.get(discordId) ?? 0;
    if (now - last < 5 * 60000)
        return; // cooldown 5 min
    const char = await client_1.prisma.rpgCharacter.findUnique({
        where: { discordId },
        include: { equipment: true },
    });
    if (!char)
        return;
    const stats = computeStats(char);
    if (char.currentEnergy >= stats.maxEnergy)
        return; // já cheio
    const gained = Math.floor(Math.random() * 2) + 1; // +1 ou +2
    const newEnergy = Math.min(char.currentEnergy + gained, stats.maxEnergy);
    await client_1.prisma.rpgCharacter.update({
        where: { discordId },
        data: { currentEnergy: newEnergy, lastEnergyTick: new Date() },
    });
    _chatEnergyCooldowns.set(discordId, now);
}
// ─── Restaurar HP / Energia ───────────────────────────────────────────────
async function restoreHp(discordId, amount) {
    const char = await getCharacter(discordId);
    if (!char)
        return null;
    const stats = computeStats(char);
    const newHp = amount === 'full' ? stats.maxHp : Math.min(char.currentHp + amount, stats.maxHp);
    return client_1.prisma.rpgCharacter.update({ where: { discordId }, data: { currentHp: newHp } });
}
async function restoreEnergy(discordId, amount) {
    const char = await getCharacter(discordId);
    if (!char)
        return null;
    const stats = computeStats(char);
    const newEn = amount === 'full' ? stats.maxEnergy : Math.min(char.currentEnergy + amount, stats.maxEnergy);
    return client_1.prisma.rpgCharacter.update({ where: { discordId }, data: { currentEnergy: newEn } });
}
async function distributeStatPoints(discordId, stat, points) {
    const char = await getCharacter(discordId);
    if (!char)
        return { success: false, message: 'Personagem não encontrado.' };
    if (char.statPoints < points)
        return { success: false, message: `Pontos insuficientes! Você tem **${char.statPoints}** ponto(s).` };
    await client_1.prisma.rpgCharacter.update({
        where: { discordId },
        data: { [stat]: { increment: points }, statPoints: { decrement: points } },
    });
    return { success: true, message: `+${points} em ${stat}!` };
}
// ─── Classe e evolução ────────────────────────────────────────────────────
async function setClass(discordId, classId) {
    const cls = (0, classes_1.getClass)(classId);
    if (!cls)
        return { success: false, message: 'Classe inválida.' };
    const char = await getCharacter(discordId);
    if (!char)
        return { success: false, message: 'Personagem não encontrado.' };
    if (cls.tier === 2) {
        if (!cls.evolveFrom || char.class !== cls.evolveFrom) {
            return { success: false, message: `Para se tornar **${cls.name}**, você precisa ser **${(0, classes_1.getClass)(cls.evolveFrom ?? '')?.name ?? '???'}** primeiro.` };
        }
        if (char.level < 20)
            return { success: false, message: 'Precisa ser nível 20 para evoluir para uma classe Tier 2.' };
    }
    if (cls.tier === 3) {
        if (!cls.evolveFrom || char.class !== cls.evolveFrom) {
            return { success: false, message: `Para se tornar **${cls.name}**, você precisa ser **${(0, classes_1.getClass)(cls.evolveFrom ?? '')?.name ?? '???'}** primeiro.` };
        }
        if (char.level < 40)
            return { success: false, message: 'Precisa ser nível 40 para evoluir para uma classe Tier 3.' };
    }
    // ao trocar de classe tier 1 (criação), reset de stats base
    const baseStats = cls.baseStats;
    await client_1.prisma.rpgCharacter.update({
        where: { discordId },
        data: {
            class: classId,
            strength: baseStats.str, agility: baseStats.agi,
            intelligence: baseStats.int, vitality: baseStats.vit, luck: baseStats.lck,
            maxHp: cls.baseHp + baseStats.vit * cls.hpPerVit,
            currentHp: cls.baseHp + baseStats.vit * cls.hpPerVit,
            maxEnergy: cls.baseEnergy, currentEnergy: cls.baseEnergy,
        },
    });
    return { success: true, message: `Agora você é um(a) **${cls.name}** ${cls.emoji}!` };
}
// ─── Reencarnação (Geração) ───────────────────────────────────────────────
async function reincarnate(discordId) {
    const char = await getCharacter(discordId);
    if (!char)
        return { success: false, message: 'Personagem não encontrado.' };
    if (char.level < 50)
        return { success: false, message: 'Precisa ser nível 50 para se reencarnar.' };
    const cls = (0, classes_1.getClass)(char.class) ?? classes_1.CLASSES['guerreiro'];
    const baseStats = cls.baseStats;
    await client_1.prisma.rpgCharacter.update({
        where: { discordId },
        data: {
            generation: char.generation + 1,
            level: 1, xp: 0,
            strength: baseStats.str + (char.generation * 2),
            agility: baseStats.agi + (char.generation * 2),
            intelligence: baseStats.int + (char.generation * 2),
            vitality: baseStats.vit + (char.generation * 2),
            luck: baseStats.lck + (char.generation * 2),
            statPoints: 0, skillPoints: 0,
            currentHp: cls.baseHp, maxHp: cls.baseHp,
            currentEnergy: cls.baseEnergy, maxEnergy: cls.baseEnergy,
            // mantém ouro e habilidade divina
        },
    });
    return { success: true, message: `🌟 Você se reencarnou para a **Geração ${char.generation + 1}**! Seus atributos base aumentaram permanentemente.` };
}
// ─── Helpers ──────────────────────────────────────────────────────────────
function hpBar(current, max, len = 12) {
    const pct = Math.max(0, Math.min(1, current / max));
    const filled = Math.round(pct * len);
    const bar = '█'.repeat(filled) + '░'.repeat(len - filled);
    const pctStr = Math.round(pct * 100);
    return `\`${bar}\` ${pctStr}%`;
}
function xpBar(xp, level, len = 12) {
    const needed = (0, classes_1.rpgXpForLevel)(level);
    const pct = Math.min(1, xp / needed);
    const filled = Math.round(pct * len);
    const bar = '█'.repeat(filled) + '░'.repeat(len - filled);
    return `\`${bar}\` ${xp}/${needed}`;
}
//# sourceMappingURL=character.js.map