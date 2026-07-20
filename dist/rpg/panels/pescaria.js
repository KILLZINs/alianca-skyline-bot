"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE PESCA
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPescariaEmbed = buildPescariaEmbed;
exports.buildPescariaButtons = buildPescariaButtons;
exports.castFishingLine = castFishingLine;
exports.reelFishingLine = reelFishingLine;
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const character_1 = require("../services/character");
const fishing_1 = require("../constants/fishing");
const day_night_1 = require("../services/day-night");
const class_missions_1 = require("../services/class-missions");
async function buildPescariaEmbed(char) {
    const phase = (0, day_night_1.getDayPhase)();
    const phaseInfo = day_night_1.PHASE_INFO[phase];
    const stats = (0, character_1.computeStats)(char);
    // Verificar se há uma sessão ativa
    const session = await client_1.prisma.rpgFishingSession.findUnique({ where: { discordId: char.discordId } });
    const isWaiting = session && session.reelableAt > new Date();
    const isReady = session && session.reelableAt <= new Date();
    let status;
    if (isWaiting) {
        // <t:UNIX:R> atualiza em tempo real no Discord (ex: "daqui 1 minuto")
        const ts = Math.floor(session.reelableAt.getTime() / 1000);
        status = `🎣 **Aguardando...** isca na água!\n⏳ Pronto para puxar <t:${ts}:R>`;
    }
    else if (isReady) {
        status = `🐟 **Algo puxou a isca!** Clique em 🪝 Puxar para recolher!`;
    }
    else {
        status = `Jogue a isca na água e espere. Pesque para ganhar peixes, ouro e itens raros!\n\n**Custo:** ${fishing_1.FISHING_ENERGY_COST}⚡ Energia · **Espera:** 2 minutos`;
    }
    return new discord_js_1.EmbedBuilder()
        .setColor(0x1E90FF)
        .setTitle('🎣 Área de Pesca')
        .setDescription(status)
        .addFields({ name: '⚡ Energia', value: `**${char.currentEnergy}/${stats.maxEnergy}**`, inline: true }, {
        name: `${phaseInfo.emoji} ${phaseInfo.name}`,
        value: phaseInfo.fishBonus > 0
            ? `+${Math.round(phaseInfo.fishBonus * 100)}% chance de peixe raro! 🐟`
            : 'Sem bônus de pesca agora.',
        inline: true,
    }, {
        name: '📋 Peixes Possíveis',
        value: [
            '🐟 Comum — Peixes pequenos e lixo',
            '🐠 Incomum — Frutos do mar, restauram HP/Energia',
            '🔵 Raro — Peixes grandes e baús afogados',
            '🟣 Épico — Criaturas marinhas lendárias',
            '⭐ Lendário — Dragão do Mar (muy difícil)',
        ].join('\n'),
        inline: false,
    })
        .setFooter({ text: '🎣 Pesca disponível a cada 10 minutos' });
}
function buildPescariaButtons(char, sessionExists, isReady) {
    const stats = (0, character_1.computeStats)(char);
    const semEnergia = char.currentEnergy < fishing_1.FISHING_ENERGY_COST;
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:pesca_lancar')
        .setLabel(`🎣 Lançar Isca (${fishing_1.FISHING_ENERGY_COST}⚡)`)
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(sessionExists || semEnergia), new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:pesca_puxar')
        .setLabel('🪝 Puxar!')
        .setStyle(discord_js_1.ButtonStyle.Success)
        .setDisabled(!isReady), new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:pescaria').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary));
    return [row];
}
// ─── Lançar isca ──────────────────────────────────────────────────────────────
async function castFishingLine(char) {
    if (char.currentEnergy < fishing_1.FISHING_ENERGY_COST) {
        return { success: false, message: `Energia insuficiente! Precisa de **${fishing_1.FISHING_ENERGY_COST}⚡**.` };
    }
    const existing = await client_1.prisma.rpgFishingSession.findUnique({ where: { discordId: char.discordId } });
    if (existing) {
        if (existing.reelableAt > new Date()) {
            const rem = Math.ceil((existing.reelableAt.getTime() - Date.now()) / 1000);
            return { success: false, message: `Já tem isca na água! Aguarde **${Math.ceil(rem / 60)} min**.` };
        }
        // Sessão expirada sem coletar — limpar
        await client_1.prisma.rpgFishingSession.delete({ where: { discordId: char.discordId } });
    }
    // Cooldown de 10 min desde última pesca
    if (char.lastFishing) {
        const elapsed = Date.now() - char.lastFishing.getTime();
        if (elapsed < 10 * 60 * 1000) {
            const rem = Math.ceil((10 * 60 * 1000 - elapsed) / 60000);
            return { success: false, message: `Aguarde **${rem} min** antes de pescar novamente.` };
        }
    }
    const castAt = new Date();
    const reelableAt = new Date(Date.now() + fishing_1.FISHING_COOLDOWN_MS);
    await Promise.all([
        client_1.prisma.rpgFishingSession.create({ data: { discordId: char.discordId, castAt, reelableAt } }),
        client_1.prisma.rpgCharacter.update({ where: { discordId: char.discordId }, data: { currentEnergy: char.currentEnergy - fishing_1.FISHING_ENERGY_COST } }),
    ]);
    return { success: true, message: `🎣 Isca lançada! Volte em **2 minutos** para puxar!` };
}
// ─── Puxar a linha ────────────────────────────────────────────────────────────
async function reelFishingLine(char) {
    const session = await client_1.prisma.rpgFishingSession.findUnique({ where: { discordId: char.discordId } });
    if (!session)
        return { success: false, message: 'Não há isca na água!' };
    if (session.reelableAt > new Date()) {
        const rem = Math.ceil((session.reelableAt.getTime() - Date.now()) / 1000);
        return { success: false, message: `Aguente! Ainda faltam **${Math.ceil(rem / 60)} min ${rem % 60} seg**.` };
    }
    // Deletar sessão
    await client_1.prisma.rpgFishingSession.delete({ where: { discordId: char.discordId } });
    const phase = (0, day_night_1.getDayPhase)();
    const fishBonus = day_night_1.PHASE_INFO[phase].fishBonus;
    const fish = (0, fishing_1.rollFish)(fishBonus);
    // Aplicar recompensa
    let newHp = char.currentHp;
    let newEnergy = char.currentEnergy;
    const stats = (0, character_1.computeStats)(char);
    if (fish.hpRestore)
        newHp = Math.min(stats.maxHp, newHp + fish.hpRestore);
    if (fish.energyRestore)
        newEnergy = Math.min(stats.maxEnergy, newEnergy + fish.energyRestore);
    await client_1.prisma.rpgCharacter.update({
        where: { discordId: char.discordId },
        data: {
            gold: char.gold + fish.goldValue,
            currentHp: newHp,
            currentEnergy: newEnergy,
            lastFishing: new Date(),
        },
    });
    await (0, class_missions_1.incrementMissionProgress)(char.discordId, 'fish', 1).catch(() => null);
    const extras = [];
    if (fish.hpRestore && newHp > char.currentHp)
        extras.push(`+${newHp - char.currentHp} ❤️ HP`);
    if (fish.energyRestore && newEnergy > char.currentEnergy)
        extras.push(`+${newEnergy - char.currentEnergy} ⚡ Energia`);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(fishing_1.RARITY_COLOR[fish.rarity] ?? 0x1E90FF)
        .setTitle(`${fish.emoji} Você pescou: ${fish.name}!`)
        .setDescription(`**Raridade:** ${fishing_1.RARITY_LABEL[fish.rarity]}\n` +
        `**Valor:** +${fish.goldValue} 🪙\n` +
        (extras.length ? extras.join(' | ') : '') +
        `\n\n${fishBonus > 0 ? `✨ Bônus de ${day_night_1.PHASE_INFO[phase].emoji} ${day_night_1.PHASE_INFO[phase].name} aplicado!` : ''}`)
        .addFields({ name: '💰 Ouro Total', value: `**${char.gold + fish.goldValue}🪙**`, inline: true })
        .setFooter({ text: '🎣 Lance novamente em 10 minutos!' });
    return { success: true, embed };
}
//# sourceMappingURL=pescaria.js.map