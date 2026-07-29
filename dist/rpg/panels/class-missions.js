"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE MISSÕES DIÁRIAS POR CLASSE
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildClassMissionsEmbed = buildClassMissionsEmbed;
exports.buildClassMissionsClaimSelect = buildClassMissionsClaimSelect;
exports.buildClassMissionsButtons = buildClassMissionsButtons;
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const class_missions_1 = require("../constants/class-missions");
const class_missions_2 = require("../services/class-missions");
const classes_1 = require("../constants/classes");
function today() { return new Date().toISOString().slice(0, 10); }
async function buildClassMissionsEmbed(char) {
    await (0, class_missions_2.ensureClassMissions)(char.discordId, char.class);
    const cls = (0, classes_1.getClass)(char.class);
    const missions = await client_1.prisma.rpgClassMission.findMany({
        where: { discordId: char.discordId, dateStr: today() },
    });
    const missionLines = missions.map((m) => {
        const tpl = class_missions_1.CLASS_MISSIONS.find((t) => t.key === m.missionKey);
        if (!tpl)
            return '';
        const bar = `[${Math.min(m.progress, m.target)}/${m.target}]`;
        const status = m.claimed ? '✅' : m.completed ? '🎁' : '🔄';
        return `${status} ${tpl.emoji} **${tpl.title}** ${bar}\n> ${tpl.description}\n> 🏆 +${m.xpReward}XP | +${m.goldReward}🪙 | +${m.energyReward}⚡`;
    }).filter(Boolean);
    const completed = missions.filter((m) => m.completed && !m.claimed).length;
    const all = missions.filter((m) => m.claimed).length;
    return new discord_js_1.EmbedBuilder()
        .setColor(cls?.color ?? 0x5865F2)
        .setTitle(`📜 Missões de Classe — ${cls?.emoji ?? ''} ${cls?.name ?? char.class}`)
        .setDescription(`Missões diárias exclusivas para **${cls?.name ?? char.class}**.\nResetam todos os dias à meia-noite UTC.\n\n` +
        (missionLines.length ? missionLines.join('\n\n') : '*Nenhuma missão disponível.*'))
        .addFields({ name: '✅ Concluídas', value: `${all}/3`, inline: true }, { name: '🎁 Para Coletar', value: `${completed}`, inline: true })
        .setFooter({ text: '📜 Missões de classe · Progresso tracked automaticamente' });
}
async function buildClassMissionsClaimSelect(discordId) {
    const missions = await client_1.prisma.rpgClassMission.findMany({
        where: { discordId, dateStr: today(), completed: true, claimed: false },
    });
    if (!missions.length)
        return null;
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:class_mission_claim')
        .setPlaceholder('🎁 Coletar recompensa de missão...')
        .addOptions(missions.map((m) => {
        const tpl = class_missions_1.CLASS_MISSIONS.find((t) => t.key === m.missionKey);
        return new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel(tpl?.title ?? m.missionKey)
            .setValue(m.id)
            .setDescription(`+${m.xpReward}XP | +${m.goldReward}🪙 | +${m.energyReward}⚡`)
            .setEmoji(tpl?.emoji ?? '🎁');
    })));
}
function buildClassMissionsButtons() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:missoes_classe').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:missoes').setLabel('📋 Todas Missões').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary));
}
//# sourceMappingURL=class-missions.js.map