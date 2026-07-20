"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE EXPLORAÇÃO
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExploracaoEmbed = buildExploracaoEmbed;
exports.buildExploracaoButtons = buildExploracaoButtons;
exports.doExplore = doExplore;
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const character_1 = require("../services/character");
const exploration_1 = require("../constants/exploration");
const temp_buffs_1 = require("../services/temp-buffs");
const locations_1 = require("../constants/locations");
const day_night_1 = require("../services/day-night");
const class_missions_1 = require("../services/class-missions");
async function buildExploracaoEmbed(char) {
    const stats = (0, character_1.computeStats)(char);
    const loc = (0, locations_1.getLocation)(char.currentLocation);
    const phase = (0, day_night_1.getDayPhase)();
    const phaseInfo = day_night_1.PHASE_INFO[phase];
    const lastExplore = char.lastExplore;
    const onCooldown = lastExplore && (Date.now() - lastExplore.getTime()) < exploration_1.EXPLORE_COOLDOWN_MS;
    const cooldownRem = onCooldown
        ? Math.ceil((exploration_1.EXPLORE_COOLDOWN_MS - (Date.now() - lastExplore.getTime())) / 60000)
        : 0;
    return new discord_js_1.EmbedBuilder()
        .setColor(0x27AE60)
        .setTitle(`🌍 Exploração — ${loc.emoji} ${loc.name}`)
        .setDescription(onCooldown
        ? `⏳ Recuperando fôlego... próxima exploração em **${cooldownRem} min**`
        : `Explore os arredores de **${loc.name}** em busca de tesouros, perigos e segredos!\nCada exploração tem um evento **aleatório** diferente.`)
        .addFields({ name: '⚡ Energia', value: `**${char.currentEnergy}/${stats.maxEnergy}**`, inline: true }, { name: '⏱️ Cooldown', value: onCooldown ? `🔴 ${cooldownRem} min` : '🟢 Pronto!', inline: true }, {
        name: `${phaseInfo.emoji} Fase: ${phaseInfo.name}`,
        value: phaseInfo.xpBonus > 0 ? `+${Math.round(phaseInfo.xpBonus * 100)}% XP extra ✨` : phaseInfo.desc,
        inline: true,
    }, {
        name: '🎲 Possíveis Eventos',
        value: [
            '💰 Tesouro Escondido',
            '⚔️ Emboscada',
            '🧙 Viajante Amigável',
            '🪤 Armadilha',
            '🏛️ Ruínas Antigas',
            '⛩️ Santuário',
            '🛒 Mercador Itinerante',
            '💎 Item Raro',
            '🌿 Caminho Tranquilo',
        ].join(' · '),
        inline: false,
    }, {
        name: '💡 Custo',
        value: `**${exploration_1.EXPLORE_ENERGY_COST}⚡ Energia** por exploração`,
        inline: false,
    })
        .setFooter({ text: '🌍 Exploração disponível a cada 3 minutos' });
}
function buildExploracaoButtons(disabled) {
    return [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('rpg:explorar')
            .setLabel(`🌍 Explorar! (${exploration_1.EXPLORE_ENERGY_COST}⚡)`)
            .setStyle(discord_js_1.ButtonStyle.Success)
            .setDisabled(disabled), new discord_js_1.ButtonBuilder().setCustomId('rpg:exploracao').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary)),
    ];
}
async function doExplore(char) {
    if (char.currentEnergy < exploration_1.EXPLORE_ENERGY_COST) {
        return { success: false, message: `Energia insuficiente! Precisa de **${exploration_1.EXPLORE_ENERGY_COST}⚡**.` };
    }
    if (char.currentHp <= 0) {
        return { success: false, message: 'Você está sem HP! Cure-se na cidade antes de explorar.' };
    }
    const lastExplore = char.lastExplore;
    if (lastExplore && (Date.now() - lastExplore.getTime()) < exploration_1.EXPLORE_COOLDOWN_MS) {
        const rem = Math.ceil((exploration_1.EXPLORE_COOLDOWN_MS - (Date.now() - lastExplore.getTime())) / 60000);
        return { success: false, message: `Aguarde **${rem} min** antes de explorar novamente.` };
    }
    const phase = (0, day_night_1.getDayPhase)();
    const phaseXpBonus = 1 + day_night_1.PHASE_INFO[phase].xpBonus;
    const event = (0, exploration_1.rollExploreEvent)(char.level);
    const stats = (0, character_1.computeStats)(char);
    // Calcular resultados finais
    const xpGained = Math.round(event.xpResult * phaseXpBonus);
    const goldGained = Math.max(0, event.goldResult);
    const goldLost = event.goldResult < 0 ? Math.min(char.gold, Math.abs(event.goldResult)) : 0;
    const hpChange = event.hpResult;
    const newHp = Math.max(0, Math.min(stats.maxHp, char.currentHp + hpChange));
    const newEnergy = Math.max(0, Math.min(stats.maxEnergy, char.currentEnergy - exploration_1.EXPLORE_ENERGY_COST + Math.max(0, event.energyResult)));
    // Buff de mercador
    if (event.type === 'merchant' && event.buff && char.gold >= Math.abs(event.goldResult)) {
        await (0, temp_buffs_1.addTempBuff)(char.discordId, event.buff.type, event.buff.value, event.buff.durationMs, 'exploracao', event.buff.label);
    }
    await client_1.prisma.rpgCharacter.update({
        where: { discordId: char.discordId },
        data: {
            gold: char.gold + goldGained - goldLost,
            currentHp: newHp,
            currentEnergy: newEnergy,
            lastExplore: new Date(),
        },
    });
    // Dar XP direto (incremento simples)
    if (xpGained > 0) {
        await client_1.prisma.rpgCharacter.update({ where: { discordId: char.discordId }, data: { xp: { increment: xpGained } } });
    }
    // Missões
    await (0, class_missions_1.incrementMissionProgress)(char.discordId, 'explore', 1).catch(() => null);
    // Construir embed do resultado
    const fields = [];
    if (xpGained > 0)
        fields.push({ name: '⭐ XP', value: `+**${xpGained}**`, inline: true });
    if (goldGained > 0)
        fields.push({ name: '💰 Ouro', value: `+**${goldGained}🪙**`, inline: true });
    if (goldLost > 0)
        fields.push({ name: '💸 Ouro Perdido', value: `-**${goldLost}🪙**`, inline: true });
    if (hpChange !== 0)
        fields.push({
            name: hpChange > 0 ? '❤️ HP' : '💔 Dano',
            value: `${hpChange > 0 ? '+' : ''}**${hpChange}** (${newHp}/${stats.maxHp})`,
            inline: true,
        });
    if (event.energyResult !== 0)
        fields.push({ name: '⚡ Energia', value: `${event.energyResult > 0 ? '+' : ''}**${event.energyResult}**`, inline: true });
    if (event.type === 'merchant' && event.buff)
        fields.push({ name: '✨ Buff', value: event.buff.label, inline: true });
    const color = event.type === 'ambush' || event.type === 'trap'
        ? 0xE74C3C
        : event.type === 'treasure' || event.type === 'rare_item'
            ? 0xFFD700
            : 0x27AE60;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(`${event.emoji} ${event.title}`)
        .setDescription(event.descriptions[0])
        .addFields(fields)
        .setFooter({ text: '🌍 Próxima exploração disponível em 3 minutos' });
    return { success: true, embed };
}
//# sourceMappingURL=exploracao.js.map