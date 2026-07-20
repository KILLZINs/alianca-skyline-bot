"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTravelEmbed = buildTravelEmbed;
exports.buildTravelSelect = buildTravelSelect;
exports.buildTravelBackButton = buildTravelBackButton;
exports.travelTo = travelTo;
const discord_js_1 = require("discord.js");
const locations_1 = require("../constants/locations");
const combat_1 = require("../services/combat");
const client_1 = require("../../database/client");
function buildTravelEmbed(char) {
    const current = (0, locations_1.getLocation)(char.currentLocation);
    const envLabel = locations_1.ENV_EMOJI[char.environment] ?? char.environment;
    const available = locations_1.LOCATION_LIST.filter(l => l.id !== char.currentLocation && char.level >= l.minLevel);
    const locked = locations_1.LOCATION_LIST.filter(l => l.id !== char.currentLocation && char.level < l.minLevel);
    const availableLines = available.map(l => `${l.emoji} **${l.name}** — Nv.${l.minLevel}+ | ⚡ ${l.travelCostEnergy} energia`).join('\n') || '*Nenhum destino disponível no seu nível.*';
    const lockedLines = locked.slice(0, 4).map(l => `🔒 ~~${l.name}~~ (Nv.${l.minLevel}+)`).join('\n');
    return new discord_js_1.EmbedBuilder()
        .setColor(0x27AE60)
        .setTitle('🗺️ Sistema de Viagem')
        .addFields({ name: '📍 Localização Atual', value: `${current.emoji} **${current.name}** — ${envLabel}`, inline: false }, { name: `✅ Destinos Disponíveis (${available.length})`, value: availableLines, inline: false }, ...(lockedLines ? [{ name: '🔒 Regiões Bloqueadas', value: lockedLines, inline: false }] : []), { name: '⚡ Sua Energia', value: `**${char.currentEnergy}/${char.maxEnergy}**`, inline: true }, { name: '📊 Nível', value: `**${char.level}**`, inline: true })
        .setFooter({ text: 'Viajar consome energia e tem cooldown. Cada região tem inimigos e drops diferentes.' });
}
function buildTravelSelect(char) {
    const destinations = locations_1.LOCATION_LIST.filter(l => l.id !== char.currentLocation && char.level >= l.minLevel);
    if (destinations.length === 0)
        return null;
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:viajar_destino')
        .setPlaceholder('Selecione o destino...')
        .addOptions(destinations.slice(0, 25).map(l => new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel(`${l.name}`)
        .setValue(l.id)
        .setEmoji(l.emoji.trim())
        .setDescription(`Nv.${l.minLevel}+ | ⚡${l.travelCostEnergy} energia | ${l.hasDungeon ? 'Dungeon ✓' : 'Sem dungeon'}`))));
}
function buildTravelBackButton() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary));
}
async function travelTo(char, destinationId) {
    const dest = (0, locations_1.getLocation)(destinationId);
    if (!dest)
        return { success: false, message: 'Destino inválido.' };
    if (char.level < dest.minLevel)
        return { success: false, message: `Precisa ser nível **${dest.minLevel}** para ir a ${dest.name}.` };
    if (char.currentEnergy < dest.travelCostEnergy)
        return { success: false, message: `Energia insuficiente! Precisa de **${dest.travelCostEnergy}** de energia.` };
    const cd = (0, combat_1.isTravelOnCooldown)(char, dest.travelCooldownMin);
    if (cd.onCooldown)
        return { success: false, message: `Aguarde **${cd.remaining}** para viajar novamente.` };
    // ambiente aleatório baseado na localização
    const envs = dest.environments;
    const hour = new Date().getHours();
    let env = envs[0];
    if (hour >= 6 && hour < 20 && envs.includes('DIA'))
        env = 'DIA';
    else if (envs.includes('NOITE'))
        env = 'NOITE';
    if (Math.random() < 0.2 && envs.length > 1)
        env = envs[Math.floor(Math.random() * envs.length)];
    await client_1.prisma.rpgCharacter.update({
        where: { discordId: char.discordId },
        data: {
            currentLocation: destinationId,
            environment: env,
            currentEnergy: { decrement: dest.travelCostEnergy },
            lastTravel: new Date(),
        },
    });
    const envLabel = locations_1.ENV_EMOJI[env] ?? env;
    return { success: true, message: `✅ Você chegou em **${dest.emoji} ${dest.name}**! Ambiente: ${envLabel}` };
}
//# sourceMappingURL=travel.js.map