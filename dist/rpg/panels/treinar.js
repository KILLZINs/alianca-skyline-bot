"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE TREINAMENTO
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTreinarEmbed = buildTreinarEmbed;
exports.buildTreinarSelect = buildTreinarSelect;
exports.buildTreinarButtons = buildTreinarButtons;
exports.doTrain = doTrain;
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const character_1 = require("../services/character");
const temp_buffs_1 = require("../services/temp-buffs");
const class_missions_1 = require("../services/class-missions");
const TRAIN_COOLDOWN_MS = 20 * 60 * 1000; // 20 min entre treinos
const TRAIN_OPTIONS = [
    { id: 'str', stat: 'FOR', label: 'Força', emoji: '💪', buffType: 'atk_pct', buffValue: 0.12, durationMs: 45 * 60 * 1000, energyCost: 15, description: '+12% Ataque por 45min' },
    { id: 'agi', stat: 'AGI', label: 'Agilidade', emoji: '🏃', buffType: 'agi_pct', buffValue: 0.12, durationMs: 45 * 60 * 1000, energyCost: 15, description: '+12% AGI → Esquiva/Crítico por 45min' },
    { id: 'int', stat: 'INT', label: 'Inteligência', emoji: '🧠', buffType: 'int_pct', buffValue: 0.12, durationMs: 45 * 60 * 1000, energyCost: 15, description: '+12% INT → Dano mágico por 45min' },
    { id: 'vit', stat: 'VIT', label: 'Vitalidade', emoji: '❤️', buffType: 'def_pct', buffValue: 0.12, durationMs: 45 * 60 * 1000, energyCost: 15, description: '+12% Defesa por 45min' },
    { id: 'lck', stat: 'SOR', label: 'Sorte', emoji: '🍀', buffType: 'gold_pct', buffValue: 0.20, durationMs: 60 * 60 * 1000, energyCost: 15, description: '+20% Ouro em batalha por 1h' },
    { id: 'all', stat: 'ALL', label: 'Treino Geral', emoji: '⚡', buffType: 'xp_pct', buffValue: 0.15, durationMs: 60 * 60 * 1000, energyCost: 20, description: '+15% XP em batalha por 1h' },
];
async function buildTreinarEmbed(char) {
    const stats = (0, character_1.computeStats)(char);
    const buffs = await (0, temp_buffs_1.getActiveBuffs)(char.discordId);
    const buffText = (0, temp_buffs_1.formatBuffList)(buffs);
    const lastTrain = char.lastTrain;
    const onCooldown = lastTrain && (Date.now() - lastTrain.getTime()) < TRAIN_COOLDOWN_MS;
    const cooldownRem = onCooldown
        ? Math.ceil((TRAIN_COOLDOWN_MS - (Date.now() - lastTrain.getTime())) / 60000)
        : 0;
    return new discord_js_1.EmbedBuilder()
        .setColor(0xE67E22)
        .setTitle('🥊 Centro de Treinamento')
        .setDescription(onCooldown
        ? `⏳ Descansando... próximo treino em **${cooldownRem} min**\n\nSeus músculos precisam se recuperar!`
        : `Escolha um atributo para treinar e ganhe um buff temporário poderoso.\n**Custo:** 15–20 ⚡ Energia por treino.`)
        .addFields({ name: '⚡ Energia Atual', value: `**${char.currentEnergy}/${stats.maxEnergy}**`, inline: true }, { name: '⏱️ Cooldown', value: onCooldown ? `🔴 ${cooldownRem} min` : '🟢 Pronto!', inline: true }, { name: '✨ Buffs Ativos', value: buffText, inline: false }, {
        name: '📋 Treinos Disponíveis',
        value: TRAIN_OPTIONS.map(o => `${o.emoji} **${o.label}** — ${o.description} (${o.energyCost}⚡)`).join('\n'),
        inline: false,
    })
        .setFooter({ text: '🥊 Treinos têm cooldown de 20 minutos entre sessões' });
}
function buildTreinarSelect(disabled) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:treinar_stat')
        .setPlaceholder('Escolha o atributo para treinar...')
        .setDisabled(disabled)
        .addOptions(TRAIN_OPTIONS.map(o => new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel(`${o.emoji} ${o.label}`)
        .setValue(o.id)
        .setDescription(o.description))));
}
function buildTreinarButtons() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:treinar').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary));
}
async function doTrain(char, statId) {
    const option = TRAIN_OPTIONS.find(o => o.id === statId);
    if (!option)
        return { success: false, message: 'Treino inválido.' };
    const lastTrain = char.lastTrain;
    if (lastTrain && (Date.now() - lastTrain.getTime()) < TRAIN_COOLDOWN_MS) {
        const rem = Math.ceil((TRAIN_COOLDOWN_MS - (Date.now() - lastTrain.getTime())) / 60000);
        return { success: false, message: `Aguarde **${rem} min** antes do próximo treino.` };
    }
    const stats = (0, character_1.computeStats)(char);
    if (char.currentEnergy < option.energyCost) {
        return { success: false, message: `Energia insuficiente! Precisa de **${option.energyCost}⚡**, você tem **${char.currentEnergy}⚡**.` };
    }
    await client_1.prisma.rpgCharacter.update({
        where: { discordId: char.discordId },
        data: {
            currentEnergy: char.currentEnergy - option.energyCost,
            lastTrain: new Date(),
        },
    });
    await (0, temp_buffs_1.addTempBuff)(char.discordId, option.buffType, option.buffValue, option.durationMs, 'treinar', option.label);
    await (0, class_missions_1.incrementMissionProgress)(char.discordId, 'train', 1).catch(() => null);
    const dur = option.durationMs / 60000;
    return {
        success: true,
        message: `💪 Treino de **${option.label}** concluído!\n${option.emoji} **${option.description}** ativado por ${dur} min!\n−${option.energyCost}⚡ Energia`,
    };
}
//# sourceMappingURL=treinar.js.map