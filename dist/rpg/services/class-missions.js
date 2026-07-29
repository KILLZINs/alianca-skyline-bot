"use strict";
// ═══════════════════════════════════════════════════════════════════════
// SERVIÇO DE MISSÕES DIÁRIAS POR CLASSE
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureClassMissions = ensureClassMissions;
exports.incrementMissionProgress = incrementMissionProgress;
exports.claimClassMission = claimClassMission;
const client_1 = require("../../database/client");
const class_missions_1 = require("../constants/class-missions");
function today() { return new Date().toISOString().slice(0, 10); }
/** Garante que o personagem tem 3 missões de classe para hoje. Idempotente. */
async function ensureClassMissions(discordId, playerClass) {
    const dateStr = today();
    const existing = await client_1.prisma.rpgClassMission.findMany({ where: { discordId, dateStr } });
    if (existing.length >= 3)
        return;
    const templates = (0, class_missions_1.getMissionsForClass)(playerClass);
    for (const tpl of templates) {
        await client_1.prisma.rpgClassMission.upsert({
            where: { discordId_dateStr_missionKey: { discordId, dateStr, missionKey: tpl.key } },
            update: {},
            create: {
                discordId, dateStr,
                missionKey: tpl.key,
                target: tpl.target,
                xpReward: tpl.xpReward,
                goldReward: tpl.goldReward,
                energyReward: tpl.energyReward,
            },
        });
    }
}
/** Incrementa progresso de missões pelo tipo de trigger */
async function incrementMissionProgress(discordId, trigger, amount) {
    const dateStr = today();
    const missions = await client_1.prisma.rpgClassMission.findMany({
        where: { discordId, dateStr, completed: false },
    });
    const relevant = missions.filter((m) => {
        const tpl = class_missions_1.CLASS_MISSIONS.find((t) => t.key === m.missionKey);
        return tpl?.trigger === trigger;
    });
    for (const m of relevant) {
        const newProgress = Math.min(m.target, m.progress + amount);
        const completed = newProgress >= m.target;
        await client_1.prisma.rpgClassMission.update({
            where: { id: m.id },
            data: { progress: newProgress, completed },
        });
    }
}
/** Reivindica recompensa de uma missão concluída */
async function claimClassMission(discordId, missionId) {
    const mission = await client_1.prisma.rpgClassMission.findUnique({ where: { id: missionId } });
    if (!mission || mission.discordId !== discordId)
        return { success: false, message: 'Missão não encontrada.' };
    if (!mission.completed)
        return { success: false, message: 'Missão ainda não concluída.' };
    if (mission.claimed)
        return { success: false, message: 'Recompensa já coletada!' };
    const char = await client_1.prisma.rpgCharacter.findUnique({ where: { discordId } });
    if (!char)
        return { success: false, message: 'Personagem não encontrado.' };
    await Promise.all([
        client_1.prisma.rpgClassMission.update({ where: { id: missionId }, data: { claimed: true } }),
        client_1.prisma.rpgCharacter.update({
            where: { discordId },
            data: {
                gold: char.gold + mission.goldReward,
                currentEnergy: Math.min(char.maxEnergy, char.currentEnergy + mission.energyReward),
                xp: { increment: mission.xpReward },
            },
        }),
    ]);
    return {
        success: true,
        message: `🎁 Recompensa coletada!`,
        xp: mission.xpReward, gold: mission.goldReward, energy: mission.energyReward,
    };
}
//# sourceMappingURL=class-missions.js.map