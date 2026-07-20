"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE MEDITAÇÃO
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
exports.buildMeditarEmbed = buildMeditarEmbed;
exports.buildMeditarButtons = buildMeditarButtons;
exports.startMeditation = startMeditation;
exports.collectMeditation = collectMeditation;
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const character_1 = require("../services/character");
const day_night_1 = require("../services/day-night");
const OPTIONS = [
    { id: 'rapida', label: '5 minutos', emoji: '⏱️', durationMs: 5 * 60 * 1000, hpPercent: 0.25, energyFlat: 15, buffChance: 0 },
    { id: 'media', label: '15 minutos', emoji: '⏰', durationMs: 15 * 60 * 1000, hpPercent: 0.55, energyFlat: 30, buffChance: 0.3 },
    { id: 'profunda', label: '30 minutos', emoji: '🕰️', durationMs: 30 * 60 * 1000, hpPercent: 1.0, energyFlat: 99, buffChance: 0.7 },
];
function buildMeditarEmbed(char) {
    const stats = (0, character_1.computeStats)(char);
    const phase = (0, day_night_1.getDayPhase)();
    const phaseInfo = day_night_1.PHASE_INFO[phase];
    const isMeditating = char.meditatingUntil && char.meditatingUntil > new Date();
    const isReady = char.meditatingUntil && char.meditatingUntil <= new Date();
    let status;
    if (isMeditating) {
        const remMs = char.meditatingUntil.getTime() - Date.now();
        const remMin = Math.ceil(remMs / 60000);
        status = `🧘 **Meditando...** — ${remMin} min restante(s)\n*Use 🪷 Coletar quando terminar!*`;
    }
    else if (isReady) {
        status = `✅ **Meditação concluída!** Clique em 🪷 Coletar para receber os bônus!`;
    }
    else {
        status = `Escolha a duração da meditação abaixo.\nQuanto mais longa, maior a recuperação.`;
    }
    return new discord_js_1.EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('🧘 Meditação')
        .setDescription(status)
        .addFields({ name: '❤️ HP Atual', value: `${(0, character_1.hpBar)(char.currentHp, stats.maxHp)} **${char.currentHp}/${stats.maxHp}**`, inline: false }, { name: '⚡ Energia', value: `**${char.currentEnergy}/${stats.maxEnergy}**`, inline: true }, {
        name: `${phaseInfo.emoji} Fase do Dia — ${phaseInfo.name}`,
        value: phaseInfo.meditaBonus > 0
            ? `+${Math.round(phaseInfo.meditaBonus * 100)}% eficiência de meditação ✨`
            : phaseInfo.desc,
        inline: true,
    }, {
        name: '📋 Opções',
        value: OPTIONS.map(o => {
            const bonusMult = 1 + phaseInfo.meditaBonus;
            const hp = Math.round(o.hpPercent * 100 * bonusMult);
            const en = Math.round(o.energyFlat * bonusMult);
            const buff = o.buffChance > 0 ? ` | ${Math.round(o.buffChance * 100)}% chance de +15% XP (1h)` : '';
            return `${o.emoji} **${o.label}** — Restaura ${hp}% HP + ${en} Energia${buff}`;
        }).join('\n'),
        inline: false,
    })
        .setFooter({ text: '🧘 Meditação recarrega a cada 30 minutos' });
}
function buildMeditarButtons(char) {
    const isMeditating = char.meditatingUntil && char.meditatingUntil > new Date();
    const isReady = char.meditatingUntil && char.meditatingUntil <= new Date();
    if (isReady) {
        return [
            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:meditar_coletar').setLabel('🪷 Coletar Bônus').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary)),
        ];
    }
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:meditar_rapida').setLabel('⏱️ 5 min').setStyle(discord_js_1.ButtonStyle.Primary).setDisabled(!!isMeditating), new discord_js_1.ButtonBuilder().setCustomId('rpg:meditar_media').setLabel('⏰ 15 min').setStyle(discord_js_1.ButtonStyle.Primary).setDisabled(!!isMeditating), new discord_js_1.ButtonBuilder().setCustomId('rpg:meditar_profunda').setLabel('🕰️ 30 min').setStyle(discord_js_1.ButtonStyle.Primary).setDisabled(!!isMeditating), new discord_js_1.ButtonBuilder().setCustomId('rpg:meditar_coletar').setLabel('🪷 Coletar').setStyle(discord_js_1.ButtonStyle.Success).setDisabled(!isReady), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary));
    return [row1];
}
async function startMeditation(char, optionId) {
    // Verificar cooldown (30min desde última meditação completa)
    if (char.lastRest) {
        const elapsed = Date.now() - char.lastRest.getTime();
        const cooldownMs = 30 * 60 * 1000;
        if (elapsed < cooldownMs && !char.meditatingUntil) {
            const rem = Math.ceil((cooldownMs - elapsed) / 60000);
            return { success: false, message: `Você precisa esperar **${rem} min** antes de meditar novamente.` };
        }
    }
    if (char.meditatingUntil && char.meditatingUntil > new Date()) {
        return { success: false, message: 'Você já está meditando!' };
    }
    const option = OPTIONS.find(o => o.id === optionId);
    if (!option)
        return { success: false, message: 'Opção inválida.' };
    await client_1.prisma.rpgCharacter.update({
        where: { discordId: char.discordId },
        data: { meditatingUntil: new Date(Date.now() + option.durationMs) },
    });
    return { success: true, message: `🧘 Iniciando meditação de **${option.label}**...` };
}
async function collectMeditation(char) {
    if (!char.meditatingUntil) {
        return { success: false, message: 'Você não estava meditando.', hpGained: 0, energyGained: 0, buffGiven: false };
    }
    if (char.meditatingUntil > new Date()) {
        const rem = Math.ceil((char.meditatingUntil.getTime() - Date.now()) / 60000);
        return { success: false, message: `Ainda faltam **${rem} min** para terminar.`, hpGained: 0, energyGained: 0, buffGiven: false };
    }
    // Determinar qual opção pelo tempo de meditação estimado
    const durMs = (char.meditatingUntil.getTime() - (char.lastRest?.getTime() ?? char.meditatingUntil.getTime() - 5 * 60 * 1000));
    const option = OPTIONS.reduce((prev, cur) => Math.abs(cur.durationMs - durMs) < Math.abs(prev.durationMs - durMs) ? cur : prev) ?? OPTIONS[0];
    const phase = (0, day_night_1.getDayPhase)();
    const bonusMult = 1 + day_night_1.PHASE_INFO[phase].meditaBonus;
    const stats = (0, character_1.computeStats)(char);
    const hpGained = Math.min(stats.maxHp - char.currentHp, Math.round(stats.maxHp * option.hpPercent * bonusMult));
    const energyGained = Math.min(stats.maxEnergy - char.currentEnergy, Math.round(option.energyFlat * bonusMult));
    const buffGiven = Math.random() < option.buffChance;
    await client_1.prisma.rpgCharacter.update({
        where: { discordId: char.discordId },
        data: {
            currentHp: Math.min(stats.maxHp, char.currentHp + hpGained),
            currentEnergy: Math.min(stats.maxEnergy, char.currentEnergy + energyGained),
            meditatingUntil: null,
            lastRest: new Date(),
        },
    });
    if (buffGiven) {
        const { addTempBuff } = await Promise.resolve().then(() => __importStar(require('../services/temp-buffs')));
        await addTempBuff(char.discordId, 'xp_pct', 0.15, 60 * 60 * 1000, 'meditacao', 'XP (Meditação)');
    }
    // Progresso de missões
    const { incrementMissionProgress } = await Promise.resolve().then(() => __importStar(require('../services/class-missions')));
    await incrementMissionProgress(char.discordId, 'meditate', 1).catch(() => null);
    return { success: true, message: 'Meditação concluída!', hpGained, energyGained, buffGiven };
}
//# sourceMappingURL=meditar.js.map