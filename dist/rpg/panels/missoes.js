"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE MISSÕES — diárias e semanais
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMissoesEmbed = buildMissoesEmbed;
exports.buildMissoesClaimSelect = buildMissoesClaimSelect;
exports.buildMissoesButtons = buildMissoesButtons;
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const missoes_1 = require("../../commands/utility/missoes");
// ─── Embed de missões ──────────────────────────────────────────────────
async function buildMissoesEmbed(discordId, guildId) {
    const today = (0, missoes_1.todayStr)();
    const week = (0, missoes_1.thisWeekStr)();
    const [dailyMissions, weeklyMissions] = await Promise.all([
        client_1.prisma.dailyMission.findMany({ where: { memberId: discordId, guildId, dateStr: today }, orderBy: { completed: 'asc' } }),
        client_1.prisma.weeklyMission.findMany({ where: { memberId: discordId, guildId, weekStr: week }, orderBy: { completed: 'asc' } }),
    ]);
    // ─── Formatar missões diárias ─────────────────────────────────────
    const dailyLines = dailyMissions.map(m => {
        const pool = missoes_1.DAILY_MISSION_POOL.find(p => p.type === m.type);
        const label = pool?.label ?? m.type;
        const pct = Math.min(100, Math.floor((m.progress / m.target) * 100));
        const bar = progressBar(m.progress, m.target);
        const status = m.claimed ? '✅' : m.completed ? '🎁' : '🔘';
        return `${status} **${label}**\n${bar} ${pct}% (${m.progress}/${m.target}) | +${m.xpReward} XP +${m.coinReward} 🪙`;
    }).join('\n\n') || '*Carregando missões...*';
    // ─── Formatar missões semanais ────────────────────────────────────
    const weeklyLines = weeklyMissions.map(m => {
        const pool = missoes_1.WEEKLY_MISSION_POOL.find(p => p.type === m.type);
        const label = pool?.label ?? m.type;
        const pct = Math.min(100, Math.floor((m.progress / m.target) * 100));
        const bar = progressBar(m.progress, m.target, 10);
        const status = m.claimed ? '✅' : m.completed ? '🎁' : '🔘';
        return `${status} **${label}**\n${bar} ${pct}% (${m.progress}/${m.target}) | +${m.xpReward} XP +${m.coinReward} 🪙`;
    }).join('\n\n') || '*Carregando missões semanais...*';
    const dailyDone = dailyMissions.filter(m => m.completed && !m.claimed).length;
    const weeklyDone = weeklyMissions.filter(m => m.completed && !m.claimed).length;
    return new discord_js_1.EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('📋 Missões')
        .setDescription(`Cumpra missões para ganhar XP e Moedas!\n🎁 = pronto para coletar | ✅ = já coletado | 🔘 = em progresso`)
        .addFields({ name: `📅 Missões Diárias${dailyDone > 0 ? ` (${dailyDone} prontas!)` : ''}`, value: dailyLines, inline: false }, { name: `📆 Missões Semanais${weeklyDone > 0 ? ` (${weeklyDone} prontas!)` : ''}`, value: weeklyLines, inline: false })
        .setFooter({ text: `⚔️ Aliança Skyline RPG — Semana: ${week}` });
}
// ─── Select para coletar recompensas ──────────────────────────────────
async function buildMissoesClaimSelect(discordId, guildId) {
    const today = (0, missoes_1.todayStr)();
    const week = (0, missoes_1.thisWeekStr)();
    const [dailyReady, weeklyReady] = await Promise.all([
        client_1.prisma.dailyMission.findMany({ where: { memberId: discordId, guildId, dateStr: today, completed: true, claimed: false } }),
        client_1.prisma.weeklyMission.findMany({ where: { memberId: discordId, guildId, weekStr: week, completed: true, claimed: false } }),
    ]);
    const options = [
        ...dailyReady.map(m => {
            const pool = missoes_1.DAILY_MISSION_POOL.find(p => p.type === m.type);
            return new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel(`📅 ${pool?.label ?? m.type}`)
                .setValue(`daily:${m.id}`)
                .setDescription(`+${m.xpReward} XP, +${m.coinReward} moedas`)
                .setEmoji('🎁');
        }),
        ...weeklyReady.map(m => {
            const pool = missoes_1.WEEKLY_MISSION_POOL.find(p => p.type === m.type);
            return new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel(`📆 ${pool?.label ?? m.type}`)
                .setValue(`weekly:${m.id}`)
                .setDescription(`+${m.xpReward} XP, +${m.coinReward} moedas`)
                .setEmoji('🎁');
        }),
    ];
    if (options.length === 0)
        return null;
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:missao_coletar')
        .setPlaceholder('🎁 Coletar recompensa...')
        .addOptions(options.slice(0, 25)));
}
// ─── Botões de missões ─────────────────────────────────────────────────
function buildMissoesButtons() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:missoes').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Dungeon').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏰 Cidade').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Perfil').setStyle(discord_js_1.ButtonStyle.Secondary));
}
// ─── Helper: barra de progresso ───────────────────────────────────────
function progressBar(current, max, size = 8) {
    const pct = Math.min(1, current / max);
    const filled = Math.round(pct * size);
    return '`' + '█'.repeat(filled) + '░'.repeat(size - filled) + '`';
}
//# sourceMappingURL=missoes.js.map