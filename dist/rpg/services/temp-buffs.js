"use strict";
// ═══════════════════════════════════════════════════════════════════════
// BUFFS TEMPORÁRIOS RPG
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveBuffs = getActiveBuffs;
exports.addTempBuff = addTempBuff;
exports.clearExpiredBuffs = clearExpiredBuffs;
exports.applyBuffsToStats = applyBuffsToStats;
exports.getCombatBuffMultipliers = getCombatBuffMultipliers;
exports.formatBuffList = formatBuffList;
const client_1 = require("../../database/client");
async function getActiveBuffs(discordId) {
    return client_1.prisma.rpgTempBuff.findMany({
        where: { discordId, expiresAt: { gt: new Date() } },
    });
}
async function addTempBuff(discordId, buffType, value, durationMs, source, label) {
    // Remove buff do mesmo tipo/source para não acumular
    await client_1.prisma.rpgTempBuff.deleteMany({ where: { discordId, buffType, source } });
    return client_1.prisma.rpgTempBuff.create({
        data: {
            discordId, buffType, value, source, label,
            expiresAt: new Date(Date.now() + durationMs),
        },
    });
}
async function clearExpiredBuffs(discordId) {
    await client_1.prisma.rpgTempBuff.deleteMany({
        where: { discordId, expiresAt: { lte: new Date() } },
    });
}
function applyBuffsToStats(stats, buffs) {
    if (!buffs.length)
        return stats;
    const s = { ...stats };
    for (const b of buffs) {
        switch (b.buffType) {
            case 'str_pct':
                s.str = Math.round(s.str * (1 + b.value));
                break;
            case 'agi_pct':
                s.agi = Math.round(s.agi * (1 + b.value));
                break;
            case 'int_pct':
                s.int = Math.round(s.int * (1 + b.value));
                break;
            case 'vit_pct':
                s.vit = Math.round(s.vit * (1 + b.value));
                break;
            case 'lck_pct':
                s.lck = Math.round(s.lck * (1 + b.value));
                break;
            case 'atk_pct':
                s.attack = Math.round(s.attack * (1 + b.value));
                break;
            case 'def_pct':
                s.defense = Math.round(s.defense * (1 + b.value));
                break;
            case 'xp_pct': /* aplicado no combate */ break;
            case 'gold_pct': /* aplicado no combate */ break;
            case 'crit_flat':
                s.critChance += b.value;
                break;
        }
    }
    // Recalc CP aproximado
    s.combatPower = Math.round(s.str * 10 + s.agi * 8 + s.int * 8 + s.vit * 6 + s.lck * 4 +
        s.attack * 5 + s.defense * 3);
    return s;
}
/** Soma multiplicador xp/gold dos buffs ativos */
function getCombatBuffMultipliers(buffs) {
    let xp = 1, gold = 1;
    for (const b of buffs) {
        if (b.buffType === 'xp_pct')
            xp *= (1 + b.value);
        if (b.buffType === 'gold_pct')
            gold *= (1 + b.value);
    }
    return { xp, gold };
}
function formatBuffList(buffs) {
    if (!buffs.length)
        return '*Nenhum buff ativo*';
    return buffs.map(b => {
        const rem = Math.max(0, Math.round((b.expiresAt.getTime() - Date.now()) / 60000));
        const pct = b.buffType === 'crit_flat'
            ? `+${b.value.toFixed(1)}% Crítico`
            : `+${Math.round(b.value * 100)}% ${b.label}`;
        return `✨ **${pct}** *(${rem}min restante)*`;
    }).join('\n');
}
//# sourceMappingURL=temp-buffs.js.map