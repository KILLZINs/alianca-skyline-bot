"use strict";
// ═══════════════════════════════════════════════════════════════════════
// SISTEMA DE MISSÕES — diárias, semanais e RPG
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEEKLY_MISSION_POOL = exports.DAILY_MISSION_POOL = void 0;
exports.todayStr = todayStr;
exports.thisWeekStr = thisWeekStr;
exports.ensureDailyMissions = ensureDailyMissions;
exports.ensureWeeklyMissions = ensureWeeklyMissions;
exports.trackRpgMission = trackRpgMission;
exports.claimDailyReward = claimDailyReward;
exports.claimWeeklyReward = claimWeeklyReward;
const client_1 = require("../../database/client");
// ─── Missões diárias ──────────────────────────────────────────────────
exports.DAILY_MISSION_POOL = [
    // Social / XP
    { type: 'enviar_mensagens', label: '💬 Mensageiro', target: 20, xpReward: 50, coinReward: 30, desc: 'Envie 20 mensagens no servidor' },
    { type: 'ganhar_xp', label: '💜 Acumulador de XP', target: 100, xpReward: 80, coinReward: 50, desc: 'Ganhe 100 XP no servidor' },
    { type: 'estar_online', label: '🟢 Login Diário', target: 1, xpReward: 30, coinReward: 20, desc: 'Faça login no servidor hoje' },
    // RPG
    { type: 'matar_inimigos', label: '⚔️ Caçador', target: 5, xpReward: 120, coinReward: 80, desc: 'Derrote 5 inimigos no RPG' },
    { type: 'vencer_dungeon', label: '🏆 Conquistador', target: 3, xpReward: 150, coinReward: 100, desc: 'Vença 3 batalhas de dungeon' },
    { type: 'ganhar_ouro_rpg', label: '💰 Mercador', target: 200, xpReward: 100, coinReward: 60, desc: 'Ganhe 200 de ouro no RPG' },
    { type: 'usar_habilidade', label: '✨ Mestre das Artes', target: 3, xpReward: 90, coinReward: 60, desc: 'Use sua habilidade divina 3 vezes' },
    { type: 'viajar', label: '🗺️ Explorador', target: 2, xpReward: 70, coinReward: 45, desc: 'Viaje para 2 regiões diferentes' },
    { type: 'atacar_boss_mundial', label: '🐉 Dragonslayer', target: 1, xpReward: 200, coinReward: 150, desc: 'Ataque o Boss Mundial pelo menos 1 vez' },
];
// Selecionar missões aleatórias para o dia (3 missões)
function pickDailyMissions(count = 3) {
    const shuffled = [...exports.DAILY_MISSION_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
// ─── Missões semanais ─────────────────────────────────────────────────
exports.WEEKLY_MISSION_POOL = [
    { type: 'completar_diarias', label: '📋 Dedicado', target: 7, xpReward: 500, coinReward: 300, desc: 'Complete 7 missões diárias nesta semana' },
    { type: 'vencer_pvp', label: '⚔️ Gladiador', target: 3, xpReward: 600, coinReward: 400, desc: 'Vença 3 batalhas PvP' },
    { type: 'matar_boss_rpg', label: '💀 Matador de Bosses', target: 1, xpReward: 800, coinReward: 500, desc: 'Derrote 1 boss de dungeon' },
    { type: 'enviar_mensagens_sem', label: '💬 Social da Semana', target: 150, xpReward: 400, coinReward: 250, desc: 'Envie 150 mensagens no servidor' },
    { type: 'ganhar_xp_semanal', label: '💜 XP Semanal', target: 1000, xpReward: 700, coinReward: 450, desc: 'Ganhe 1000 XP nesta semana' },
    { type: 'participar_boss_mundial', label: '🐉 Herói da Aliança', target: 3, xpReward: 1000, coinReward: 700, desc: 'Ataque o Boss Mundial 3 vezes esta semana' },
    { type: 'craftar_itens', label: '⚒️ Artesão', target: 2, xpReward: 450, coinReward: 280, desc: 'Crie 2 itens na forja' },
    { type: 'matar_inimigos_sem', label: '⚔️ Guerreiro da Semana', target: 30, xpReward: 600, coinReward: 380, desc: 'Derrote 30 inimigos no RPG' },
];
// ─── Helpers de data ──────────────────────────────────────────────────
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}
function thisWeekStr() {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}
// ─── Garantir missões diárias ─────────────────────────────────────────
async function ensureDailyMissions(discordId, guildId) {
    const today = todayStr();
    // Verificar quantas missões já existem hoje
    const existing = await client_1.prisma.dailyMission.findMany({
        where: { memberId: discordId, guildId, dateStr: today },
    });
    if (existing.length >= 3)
        return; // já tem missões para hoje
    // Pegar tipos já existentes
    const existingTypes = new Set(existing.map(m => m.type));
    // Escolher missões que ainda não foram criadas
    const available = exports.DAILY_MISSION_POOL.filter(m => !existingTypes.has(m.type));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const toCreate = shuffled.slice(0, 3 - existing.length);
    for (const m of toCreate) {
        await client_1.prisma.dailyMission.upsert({
            where: { memberId_guildId_type_dateStr: { memberId: discordId, guildId, type: m.type, dateStr: today } },
            update: {},
            create: {
                memberId: discordId,
                guildId,
                type: m.type,
                target: m.target,
                xpReward: m.xpReward,
                coinReward: m.coinReward,
                dateStr: today,
            },
        });
    }
}
// ─── Garantir missões semanais ─────────────────────────────────────────
async function ensureWeeklyMissions(discordId, guildId) {
    const week = thisWeekStr();
    const existing = await client_1.prisma.weeklyMission.findMany({
        where: { memberId: discordId, guildId, weekStr: week },
    });
    if (existing.length >= 3)
        return;
    const existingTypes = new Set(existing.map(m => m.type));
    const available = exports.WEEKLY_MISSION_POOL.filter(m => !existingTypes.has(m.type));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const toCreate = shuffled.slice(0, 3 - existing.length);
    for (const m of toCreate) {
        await client_1.prisma.weeklyMission.upsert({
            where: { memberId_guildId_type_weekStr: { memberId: discordId, guildId, type: m.type, weekStr: week } },
            update: {},
            create: {
                memberId: discordId,
                guildId,
                type: m.type,
                target: m.target,
                xpReward: m.xpReward,
                coinReward: m.coinReward,
                weekStr: week,
            },
        });
    }
}
// ─── Rastrear progresso de missão RPG ────────────────────────────────
async function trackRpgMission(discordId, guildId, type, amount = 1) {
    const today = todayStr();
    const week = thisWeekStr();
    // Daily
    await client_1.prisma.dailyMission.updateMany({
        where: { memberId: discordId, guildId, type, dateStr: today, completed: false },
        data: { progress: { increment: amount } },
    });
    // Weekly equivalents
    const weeklyEquiv = {
        matar_inimigos: 'matar_inimigos_sem',
        vencer_dungeon: 'matar_inimigos_sem', // conta junto
        atacar_boss_mundial: 'participar_boss_mundial',
        enviar_mensagens: 'enviar_mensagens_sem',
        ganhar_xp: 'ganhar_xp_semanal',
    };
    const weeklyType = weeklyEquiv[type];
    if (weeklyType) {
        await client_1.prisma.weeklyMission.updateMany({
            where: { memberId: discordId, guildId, type: weeklyType, weekStr: week, completed: false },
            data: { progress: { increment: amount } },
        });
    }
    // Also track direct weekly types
    await client_1.prisma.weeklyMission.updateMany({
        where: { memberId: discordId, guildId, type, weekStr: week, completed: false },
        data: { progress: { increment: amount } },
    });
    // Marcar como concluídas as que atingiram target
    await markCompleted(discordId, guildId, today, week);
}
async function markCompleted(discordId, guildId, today, week) {
    const [pendingDaily, pendingWeekly] = await Promise.all([
        client_1.prisma.dailyMission.findMany({ where: { memberId: discordId, guildId, dateStr: today, completed: false } }),
        client_1.prisma.weeklyMission.findMany({ where: { memberId: discordId, guildId, weekStr: week, completed: false } }),
    ]);
    await Promise.all([
        ...pendingDaily.filter(m => m.progress >= m.target).map(m => client_1.prisma.dailyMission.update({ where: { id: m.id }, data: { completed: true } })),
        ...pendingWeekly.filter(m => m.progress >= m.target).map(m => client_1.prisma.weeklyMission.update({ where: { id: m.id }, data: { completed: true } })),
    ]);
}
// ─── Coletar recompensa ────────────────────────────────────────────────
async function claimDailyReward(missionId, discordId, guildId) {
    const mission = await client_1.prisma.dailyMission.findUnique({ where: { id: missionId } });
    if (!mission || mission.memberId !== discordId)
        return { success: false, message: 'Missão não encontrada.' };
    if (!mission.completed)
        return { success: false, message: 'Missão ainda não concluída!' };
    if (mission.claimed)
        return { success: false, message: 'Recompensa já coletada!' };
    await client_1.prisma.$transaction([
        client_1.prisma.dailyMission.update({ where: { id: missionId }, data: { claimed: true } }),
        client_1.prisma.member.upsert({
            where: { discordId },
            update: { xp: { increment: mission.xpReward }, coins: { increment: mission.coinReward } },
            create: { discordId, username: 'unknown', xp: mission.xpReward, coins: mission.coinReward },
        }),
    ]);
    // Progresso em missão semanal "completar diárias"
    await trackRpgMission(discordId, guildId, 'completar_diarias', 1);
    return { success: true, message: `✅ Recompensa coletada!`, xp: mission.xpReward, coins: mission.coinReward };
}
async function claimWeeklyReward(missionId, discordId) {
    const mission = await client_1.prisma.weeklyMission.findUnique({ where: { id: missionId } });
    if (!mission || mission.memberId !== discordId)
        return { success: false, message: 'Missão não encontrada.' };
    if (!mission.completed)
        return { success: false, message: 'Missão ainda não concluída!' };
    if (mission.claimed)
        return { success: false, message: 'Recompensa já coletada!' };
    await client_1.prisma.$transaction([
        client_1.prisma.weeklyMission.update({ where: { id: missionId }, data: { claimed: true } }),
        client_1.prisma.member.upsert({
            where: { discordId },
            update: { xp: { increment: mission.xpReward }, coins: { increment: mission.coinReward } },
            create: { discordId, username: 'unknown', xp: mission.xpReward, coins: mission.coinReward },
        }),
    ]);
    return { success: true, message: `✅ Recompensa semanal coletada!`, xp: mission.xpReward, coins: mission.coinReward };
}
//# sourceMappingURL=missoes.js.map