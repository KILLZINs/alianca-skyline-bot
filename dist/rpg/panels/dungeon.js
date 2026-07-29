"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDungeonEmbed = buildDungeonEmbed;
exports.buildDungeonSelect = buildDungeonSelect;
exports.buildDungeonButtons = buildDungeonButtons;
exports.doBattleRandom = doBattleRandom;
exports.doBattleEnemy = doBattleEnemy;
const discord_js_1 = require("discord.js");
const character_1 = require("../services/character");
const locations_1 = require("../constants/locations");
const enemies_1 = require("../constants/enemies");
const items_1 = require("../constants/items");
const combat_1 = require("../services/combat");
const combat_2 = require("../services/combat");
const embedTemplates_1 = require("../../utils/embedTemplates");
function buildDungeonEmbed(char) {
    const loc = (0, locations_1.getLocation)(char.currentLocation);
    const stats = (0, character_1.computeStats)(char);
    if (loc.isSafeZone) {
        return new discord_js_1.EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('⚔️ Dungeons')
            .setDescription(`Você está em uma **zona segura** (${loc.name}).\nViaje para uma região com dungeon primeiro!`)
            .setFooter({ text: '⚔️ Use 🗺️ Viajar para escolher uma região com dungeon.' });
    }
    if (!loc.hasDungeon) {
        return new discord_js_1.EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('⚔️ Dungeons')
            .setDescription(`${loc.name} não tem dungeon. Tente outra região!`);
    }
    const enemies = (0, enemies_1.getEnemiesForLocation)(loc.id, char.level);
    const bosses = (0, enemies_1.getBossesForLocation)(loc.id).filter(b => char.level >= b.minLevel);
    const cd = (0, combat_1.isDungeonOnCooldown)(char, 5); // 5 min cooldown padrão
    const enemyList = enemies.slice(0, 5).map(e => `${e.emoji} **${e.name}** — ${e.xpReward} XP | ${e.goldMin}~${e.goldMax} 💰`).join('\n') || '*Nenhum inimigo no seu nível aqui.*';
    const bossList = bosses.length > 0
        ? bosses.map(b => `${b.emoji} **${b.name}** [BOSS] — ${b.xpReward} XP | ${b.goldMin}~${b.goldMax} 💰`).join('\n')
        : '*Nenhum boss disponível (Nível insuficiente)*';
    const hpPct = stats.maxHp > 0 ? char.currentHp / stats.maxHp : 1;
    const hpDisplay = `${(0, character_1.hpBar)(char.currentHp, stats.maxHp)} **${char.currentHp}/${stats.maxHp}**${hpPct < 0.3 ? ' ⚠️' : ''}`;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(hpPct < 0.3 ? 0xFF6B35 : 0xE74C3C)
        .setTitle(`⚔️ Dungeons — ${loc.emoji} ${loc.name}`);
    if (hpPct < 0.3) {
        embed.addFields({ name: '⚠️ HP CRÍTICO — Cuidado!', value: 'Seu HP está muito baixo. Considere ir à **🏰 Cidade → 🏥 Curar HP** antes de batalhar.', inline: false });
    }
    embed.addFields({ name: '👹 Inimigos da Região', value: enemyList, inline: false }, { name: '💀 Bosses', value: bossList, inline: false }, { name: '🔮 Tipos de Dungeon', value: '> Use o **2º menu** abaixo para escolher um tipo especial com bônus de XP/Ouro (Fogo, Gelo, Sombra, Trovão, Abissal)', inline: false }, { name: '❤️ HP', value: hpDisplay, inline: true }, { name: '⚡ Energia', value: `**${char.currentEnergy}/${stats.maxEnergy}**`, inline: true }, { name: '⏱️ Cooldown', value: cd.onCooldown ? `🔴 ${cd.remaining}` : '🟢 Pronto!', inline: true });
    return embed.setFooter({ text: '⚔️ Selecione um inimigo normal OU escolha um Tipo de Dungeon para bônus especiais de XP/Ouro!' });
}
function buildDungeonSelect(char) {
    const loc = (0, locations_1.getLocation)(char.currentLocation);
    if (loc.isSafeZone || !loc.hasDungeon)
        return null;
    const enemies = (0, enemies_1.getEnemiesForLocation)(loc.id, char.level);
    const bosses = (0, enemies_1.getBossesForLocation)(loc.id).filter(b => char.level >= b.minLevel);
    const all = [...enemies.slice(0, 20), ...bosses];
    if (all.length === 0)
        return null;
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:dungeon_inimigo')
        .setPlaceholder('Escolha o inimigo para batalhar...')
        .addOptions(all.map(e => new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel(`${e.name}${e.type === 'boss' ? ' [BOSS]' : e.type === 'elite' ? ' [Elite]' : ''}`)
        .setValue(e.id)
        .setEmoji(e.emoji.trim())
        .setDescription(`HP: ${e.baseHp} | ATK: ${e.baseAttack} | ${e.xpReward} XP | ${e.goldMin}~${e.goldMax}💰`))));
}
function buildDungeonButtons(char) {
    const loc = (0, locations_1.getLocation)(char.currentLocation);
    const enemies = (0, enemies_1.getEnemiesForLocation)(loc.id, char.level);
    const bosses = (0, enemies_1.getBossesForLocation)(loc.id).filter(b => char.level >= b.minLevel);
    const hasEnemies = enemies.length > 0 || bosses.length > 0;
    const cd = (0, combat_1.isDungeonOnCooldown)(char, 5);
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon_aleatorio').setLabel('⚡ Batalha Rápida').setStyle(discord_js_1.ButtonStyle.Danger).setDisabled(!hasEnemies || cd.onCooldown || char.currentHp <= 0), new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon_boss').setLabel('💀 Boss').setStyle(discord_js_1.ButtonStyle.Danger).setDisabled(bosses.length === 0 || cd.onCooldown || char.currentHp <= 0), new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏰 Cidade').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Perfil').setStyle(discord_js_1.ButtonStyle.Secondary));
}
async function doBattleRandom(char, guildId) {
    const loc = (0, locations_1.getLocation)(char.currentLocation);
    const enemies = (0, enemies_1.getEnemiesForLocation)(loc.id, char.level);
    if (enemies.length === 0) {
        return {
            embed: new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setTitle('Sem Inimigos').setDescription('Nenhum inimigo encontrado aqui no seu nível.'),
            rows: [buildDungeonButtons(char)],
        };
    }
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const result = await (0, combat_2.runCombat)(char, enemy, false, guildId);
    return buildCombatResultEmbed(result, char);
}
async function doBattleEnemy(char, enemyId, guildId) {
    const enemy = (0, enemies_1.getEnemy)(enemyId);
    if (!enemy) {
        return {
            embed: new discord_js_1.EmbedBuilder().setColor(0xE74C3C).setTitle('Erro').setDescription('Inimigo não encontrado.'),
            rows: [],
        };
    }
    const result = await (0, combat_2.runCombat)(char, enemy, true); // usa habilidade divina
    return buildCombatResultEmbed(result, char);
}
function buildCombatResultEmbed(result, char) {
    const color = result.result === 'vitoria' ? 0x27AE60 : result.result === 'derrota' ? 0xE74C3C : 0xF39C12;
    const title = result.result === 'vitoria' ? '🏆 Vitória!' : result.result === 'derrota' ? '💀 Derrota!' : '💥 Empate!';
    // trunca o log para caber no embed (max 4096 chars)
    const fullLog = result.log.join('\n');
    const logSlice = fullLog.length > 1800 ? '...\n' + fullLog.slice(-1600) : fullLog;
    // Barra de HP após o combate
    const stats = (0, character_1.computeStats)(char);
    const hpPct = stats.maxHp > 0 ? result.playerHpLeft / stats.maxHp : 0;
    const hpBarStr = (0, character_1.hpBar)(result.playerHpLeft, stats.maxHp);
    const hpCritical = hpPct < 0.3 && result.playerHpLeft > 0;
    const hpStatus = hpCritical ? ' ⚠️ **HP CRÍTICO!**' : (result.playerHpLeft <= 0 ? ' 💀 Derrotado' : '');
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(logSlice)
        .addFields({ name: '⭐ XP Ganho', value: `+**${result.xpGained}**`, inline: true }, { name: '💰 Ouro Ganho', value: `+**${result.goldGained}**`, inline: true }, {
        name: `❤️ HP Restante${hpStatus}`,
        value: `${hpBarStr} **${result.playerHpLeft}/${stats.maxHp}**`,
        inline: false,
    }, { name: '⚡ Energia Restante', value: `**${result.playerEnergyLeft}/${stats.maxEnergy}**`, inline: true });
    if (result.itemsDropped.length > 0) {
        const dropText = result.itemsDropped.map(id => {
            const item = (0, items_1.getItem)(id);
            return item ? `${item.emoji} **${item.name}**` : id;
        }).join('  •  ');
        embed.addFields({ name: `🎁 ${result.itemsDropped.length} Item(ns) Obtido(s)!`, value: dropText });
    }
    // Aplicar template customizável (se existir)
    const tplKey = result.result === 'vitoria' ? 'combat.victory' : result.result === 'derrota' ? 'combat.defeat' : 'combat.draw';
    (0, embedTemplates_1.applyTemplate)(embed, tplKey);
    const combatBtns = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:dungeon_aleatorio')
        .setLabel('⚡ Batalhar Novamente')
        .setStyle(discord_js_1.ButtonStyle.Danger)
        .setDisabled(result.playerHpLeft <= 0), ...(hpCritical
        ? [new discord_js_1.ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏥 Ir se Curar!').setStyle(discord_js_1.ButtonStyle.Success)]
        : [new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Escolher Inimigo').setStyle(discord_js_1.ButtonStyle.Secondary)]), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('👤 Perfil').setStyle(discord_js_1.ButtonStyle.Secondary));
    const rows = [combatBtns];
    return { embed, rows };
}
//# sourceMappingURL=dungeon.js.map