"use strict";
// ═══════════════════════════════════════════════════════════════════════
// HANDLER DE SELECT MENUS RPG
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
exports.handleRpgSelect = handleRpgSelect;
const character_1 = require("../services/character");
const travel_1 = require("../panels/travel");
const profile_1 = require("../panels/profile");
const travel_2 = require("../panels/travel");
const dungeon_1 = require("../panels/dungeon");
const shop_1 = require("../panels/shop");
const inventory_1 = require("../services/inventory");
const inventario_1 = require("../panels/inventario");
const guild_1 = require("../panels/guild");
const forja_1 = require("../panels/forja");
const client_1 = require("../../database/client");
const embeds_1 = require("../../utils/embeds");
async function handleRpgSelect(i, action) {
    const discordId = i.user.id;
    const username = i.user.username;
    try {
        // ── Casos com parâmetros dinâmicos (antes do switch) ─────────────────
        if (action.startsWith('worldboss_level')) {
            await i.deferUpdate();
            const templateIndex = parseInt(action.split(':')[1] ?? '0', 10);
            const level = parseInt(i.values[0], 10);
            const { spawnWorldBoss } = await Promise.resolve().then(() => __importStar(require('../services/worldBoss')));
            const result = await spawnWorldBoss(i.guildId ?? '', templateIndex, level);
            const { buildWorldBossEmbed, buildWorldBossButtons } = await Promise.resolve().then(() => __importStar(require('../panels/worldBoss')));
            const guildId = i.guildId ?? '';
            const [bossEmbed, bossButtons] = await Promise.all([
                buildWorldBossEmbed(guildId),
                buildWorldBossButtons(guildId, true),
            ]);
            const feedbackEmbed = result.success
                ? (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).successEmbed('🐉 Boss Invocado!', result.message)
                : (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).errorEmbed('Erro', result.message);
            await i.editReply({ embeds: [feedbackEmbed, bossEmbed], components: bossButtons });
            return;
        }
        switch (action) {
            // ── Distribuir ponto de stat ─────────────────────────────────────────
            case 'distribuir_stat': {
                await i.deferUpdate();
                const stat = i.values[0];
                const result = await (0, character_1.distributeStatPoints)(discordId, stat, 1);
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const stats = (0, character_1.computeStats)(char);
                const { buildPontosEmbed, buildPontosSelect } = await Promise.resolve().then(() => __importStar(require('../panels/profile')));
                if (result.success) {
                    await i.editReply({
                        embeds: [buildPontosEmbed(char, stats)],
                        components: [buildPontosSelect(char.statPoints)],
                    });
                }
                else {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Erro', result.message)] });
                }
                break;
            }
            // ── Viajar para destino ──────────────────────────────────────────────
            case 'viajar_destino': {
                await i.deferUpdate();
                let char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const result = await (0, travel_1.travelTo)(char, i.values[0]);
                if (!result.success) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Viagem falhou', result.message)] });
                    return;
                }
                char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const select = (0, travel_2.buildTravelSelect)(char);
                await i.editReply({
                    embeds: [(0, travel_2.buildTravelEmbed)(char)],
                    components: select ? [select, (0, travel_2.buildTravelBackButton)()] : [(0, travel_2.buildTravelBackButton)()],
                });
                break;
            }
            // ── Batalha dungeon com inimigo específico ───────────────────────────
            case 'dungeon_inimigo': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                if (char.currentHp <= 0) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem HP', 'Você está sem HP! Vá à cidade e se cure primeiro.')], components: [] });
                    return;
                }
                if (char.currentEnergy < 10) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Energia ⚡', `Você tem apenas **${char.currentEnergy}** de energia — mínimo para batalhar é **10**.\nVá à 🏰 Cidade → 🏥 Curar para restaurar energia.`)], components: [] });
                    return;
                }
                const { embed, rows } = await (0, dungeon_1.doBattleEnemy)(char, i.values[0]);
                await i.editReply({ embeds: [embed], components: rows });
                break;
            }
            // ── Categoria da loja ────────────────────────────────────────────────
            case 'loja_categoria': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const category = i.values[0];
                const itemSelect = (0, shop_1.buildShopItemSelect)(char, category);
                await i.editReply({
                    embeds: [(0, shop_1.buildShopEmbed)(char, category)],
                    components: itemSelect ? [itemSelect, (0, shop_1.buildShopButtons)(category)] : [(0, shop_1.buildShopButtons)(category)],
                });
                break;
            }
            // ── Comprar item na loja ─────────────────────────────────────────────
            case 'loja_comprar': {
                await i.deferUpdate();
                const itemId = i.values[0];
                const result = await (0, inventory_1.buyItem)(discordId, itemId);
                if (result.success) {
                    await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Compra realizada!', result.message)] });
                }
                else {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Erro na compra', result.message)] });
                }
                break;
            }
            // ── Ação com item do inventário ──────────────────────────────────────
            case 'inventario_acao': {
                await i.deferUpdate();
                const itemId = i.values[0];
                const select = (0, inventario_1.buildItemActionSelect)(itemId);
                if (!select) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'Nenhuma ação disponível para este item.')] });
                    return;
                }
                const { getItem } = await Promise.resolve().then(() => __importStar(require('../constants/items')));
                const item = getItem(itemId);
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
                await i.editReply({
                    embeds: [new EmbedBuilder().setColor(0x3498DB).setTitle(`${item?.emoji ?? '❓'} ${item?.name ?? itemId}`).setDescription(item?.description ?? '').addFields({ name: '📊 Raridade', value: item?.rarity ?? '-', inline: true }, { name: '💰 Venda', value: `${item?.sellPrice ?? 0} ouro`, inline: true }, { name: '📌 Slot', value: item?.slot ?? '-', inline: true })],
                    components: [select],
                });
                break;
            }
            // ── Executar ação com item (equip/usar/vender) ───────────────────────
            case 'item_acao': {
                await i.deferUpdate();
                const [actionType, itemId] = i.values[0].split(':');
                let result;
                if (actionType === 'equip') {
                    result = await (0, inventory_1.equipItem)(discordId, itemId);
                }
                else if (actionType === 'usar') {
                    result = await (0, inventory_1.useConsumable)(discordId, itemId);
                }
                else if (actionType === 'vender') {
                    result = await (0, inventory_1.sellItem)(discordId, itemId, 1);
                }
                else {
                    result = { success: false, message: 'Ação desconhecida.' };
                }
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { embed: invEmbed, select: invSelect } = await (0, inventario_1.buildInventarioEmbed)(char);
                if (result.success) {
                    const { infoEmbed } = await Promise.resolve().then(() => __importStar(require('../../utils/embeds')));
                    await i.editReply({
                        embeds: [infoEmbed('✅ Concluído', result.message), invEmbed],
                        components: invSelect ? [invSelect, (0, inventario_1.buildInventarioButtons)()] : [(0, inventario_1.buildInventarioButtons)()],
                    });
                }
                else {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Erro', result.message)] });
                }
                break;
            }
            // ── Equipar habilidade divina ─────────────────────────────────────────
            case 'equipar_skill': {
                await i.deferUpdate();
                const skillId = i.values[0];
                const { DIVINE_SKILLS } = await Promise.resolve().then(() => __importStar(require('../constants/skills')));
                const skill = DIVINE_SKILLS[skillId];
                if (!skill) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'Habilidade inválida.')] });
                    return;
                }
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                if (char.level < skill.unlockLevel) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Nível insuficiente', `Precisa ser nível ${skill.unlockLevel} para esta habilidade.`)] });
                    return;
                }
                await client_1.prisma.rpgCharacter.update({
                    where: { discordId },
                    data: { divineSkillId: skillId, divineSkillRank: 'F', divineSkillExp: 0 },
                });
                await i.editReply({ embeds: [(0, embeds_1.successEmbed)('Habilidade Equipada!', `${skill.emoji} **${skill.name}** equipada com sucesso!`)] });
                break;
            }
            // ── Guilda: entrar ────────────────────────────────────────────────────
            case 'guild_entrar': {
                await i.deferUpdate();
                const guildId = i.values[0];
                const result = await (0, guild_1.joinGuild)(discordId, guildId);
                await i.editReply({
                    embeds: [result.success ? (0, embeds_1.successEmbed)('Guilda', result.message) : (0, embeds_1.errorEmbed)('Erro', result.message)],
                });
                break;
            }
            // ── Forja: fabricar item ──────────────────────────────────────────────
            case 'forja_receita': {
                await i.deferUpdate();
                const result = await (0, forja_1.craftItem)(discordId, i.values[0]);
                await i.editReply({
                    embeds: [result.success ? (0, embeds_1.successEmbed)('Forja', result.message) : (0, embeds_1.errorEmbed)('Erro na Forja', result.message)],
                });
                break;
            }
            // ── Escolher classe inicial (/rpg start) ──────────────────────────────
            case 'escolher_classe': {
                await i.deferUpdate();
                // valor tem formato "start_class:<classId>"
                const classId = i.values[0].replace('start_class:', '');
                const { setClass } = await Promise.resolve().then(() => __importStar(require('../services/character')));
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const result = await setClass(discordId, classId);
                if (!result.success) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Erro', result.message)] });
                    return;
                }
                // recarrega o personagem com a classe definida e mostra o perfil
                const updated = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const stats = (0, character_1.computeStats)(updated);
                const { getClass } = await Promise.resolve().then(() => __importStar(require('../constants/classes')));
                const cls = getClass(classId);
                await i.editReply({
                    content: `${cls?.emoji ?? '⚔️'} **Personagem criado!** Bem-vindo à aventura, **${username}**!`,
                    embeds: [(0, profile_1.buildProfileEmbed)(updated, stats)],
                    components: (0, profile_1.buildProfileButtons)(updated),
                });
                break;
            }
            // ── Boss Mundial: escolher template ─────────────────────────────────
            case 'worldboss_template': {
                await i.deferUpdate();
                const templateIndex = parseInt(i.values[0], 10);
                const { buildWorldBossLevelSelect } = await Promise.resolve().then(() => __importStar(require('../panels/worldBoss')));
                const { WORLD_BOSS_TEMPLATES } = await Promise.resolve().then(() => __importStar(require('../services/worldBoss')));
                const { EmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
                const template = WORLD_BOSS_TEMPLATES[templateIndex];
                const step2Embed = new EmbedBuilder()
                    .setColor(0xE74C3C)
                    .setTitle(`🐉 Invocar Boss Mundial — Passo 2`)
                    .setDescription(`**${template?.emoji} ${template?.name}** selecionado!\n\nEscolha a dificuldade (nível):`)
                    .addFields({ name: '📋 Habilidades', value: template?.abilities.join('\n') ?? '-' });
                await i.editReply({ embeds: [step2Embed], components: [buildWorldBossLevelSelect(templateIndex)] });
                break;
            }
            // worldboss_level handled below via startsWith check
            // ── Missões: coletar recompensa ───────────────────────────────────────
            case 'missao_coletar': {
                await i.deferUpdate();
                const [missionType, missionId] = i.values[0].split(':');
                const guildId = i.guildId ?? '';
                let result;
                if (missionType === 'daily') {
                    const { claimDailyReward } = await Promise.resolve().then(() => __importStar(require('../../commands/utility/missoes')));
                    result = await claimDailyReward(missionId, discordId, guildId);
                }
                else {
                    const { claimWeeklyReward } = await Promise.resolve().then(() => __importStar(require('../../commands/utility/missoes')));
                    result = await claimWeeklyReward(missionId, discordId);
                }
                const { ensureDailyMissions, ensureWeeklyMissions } = await Promise.resolve().then(() => __importStar(require('../../commands/utility/missoes')));
                const { buildMissoesEmbed, buildMissoesClaimSelect, buildMissoesButtons } = await Promise.resolve().then(() => __importStar(require('../panels/missoes')));
                await Promise.all([ensureDailyMissions(discordId, guildId), ensureWeeklyMissions(discordId, guildId)]);
                const [missoesEmbed, claimSelect] = await Promise.all([
                    buildMissoesEmbed(discordId, guildId),
                    buildMissoesClaimSelect(discordId, guildId),
                ]);
                const feedbackEmbed = result.success
                    ? (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).successEmbed('🎁 Recompensa Coletada!', `${result.message}\n+**${result.xp}** XP | +**${result.coins}** 🪙`)
                    : (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).errorEmbed('Erro', result.message);
                const missaoRows = claimSelect ? [claimSelect, buildMissoesButtons()] : [buildMissoesButtons()];
                await i.editReply({ embeds: [feedbackEmbed, missoesEmbed], components: missaoRows });
                break;
            }
            // ── 🥊 Treinar: escolher stat ─────────────────────────────────────────
            case 'treinar_stat': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { doTrain, buildTreinarEmbed, buildTreinarSelect, buildTreinarButtons } = await Promise.resolve().then(() => __importStar(require('../panels/treinar')));
                const result = await doTrain(char, i.values[0]);
                const updatedChar = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const lastTrain = updatedChar.lastTrain;
                const onCd = !!(lastTrain && (Date.now() - lastTrain.getTime()) < 20 * 60 * 1000);
                const embed = await buildTreinarEmbed(updatedChar);
                const fb = result.success
                    ? (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).successEmbed('🥊 Treino!', result.message)
                    : (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).errorEmbed('Treino', result.message);
                await i.editReply({ embeds: [fb, embed], components: [buildTreinarSelect(onCd), buildTreinarButtons()] });
                break;
            }
            // ── 🍺 Taverna: pedir item ────────────────────────────────────────────
            case 'taverna_pedir': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { buyTavernaItem, buildTavernaEmbed, buildTavernaMenuSelect, buildTavernaButtons } = await Promise.resolve().then(() => __importStar(require('../panels/taverna')));
                const result = await buyTavernaItem(char, i.values[0]);
                const updatedChar = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const fb = result.success
                    ? (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).successEmbed('🍺 Taverna!', result.message)
                    : (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).errorEmbed('Taverna', result.message);
                await i.editReply({ embeds: [fb, await buildTavernaEmbed(updatedChar)], components: [buildTavernaMenuSelect(), buildTavernaButtons()] });
                break;
            }
            // ── ⚔️ Dungeon tipo: escolher ─────────────────────────────────────────
            case 'dungeon_tipo_escolher': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                if (char.currentHp <= 0) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem HP', 'Cure-se antes de entrar na dungeon.')] });
                    break;
                }
                if (char.currentEnergy < 12) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Energia ⚡', `Precisa de **12⚡** para entrar nesta dungeon. Você tem **${char.currentEnergy}⚡**.`)] });
                    break;
                }
                const { doBattleWithType, buildDungeonTypeEmbed, buildDungeonTypeSelect, buildDungeonTypeButtons } = await Promise.resolve().then(() => __importStar(require('../panels/dungeon-tipo')));
                const { embed, rows } = await doBattleWithType(char, i.values[0], true);
                await i.editReply({ embeds: [embed], components: rows });
                break;
            }
            // ── 📜 Missões de classe: coletar ─────────────────────────────────────
            case 'class_mission_claim': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { claimClassMission } = await Promise.resolve().then(() => __importStar(require('../services/class-missions')));
                const { buildClassMissionsEmbed, buildClassMissionsClaimSelect, buildClassMissionsButtons } = await Promise.resolve().then(() => __importStar(require('../panels/class-missions')));
                const result = await claimClassMission(discordId, i.values[0]);
                const embed = await buildClassMissionsEmbed(char);
                const claimSel = await buildClassMissionsClaimSelect(discordId);
                const rows = claimSel ? [claimSel, buildClassMissionsButtons()] : [buildClassMissionsButtons()];
                const fb = result.success
                    ? (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).successEmbed('🎁 Missão!', `${result.message}\n+**${result.xp}** XP | +**${result.gold}** 🪙 | +**${result.energy}** ⚡`)
                    : (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).errorEmbed('Missão', result.message);
                await i.editReply({ embeds: [fb, embed], components: rows });
                break;
            }
            // ── 🌎 Evento mundial: iniciar ────────────────────────────────────────
            case 'evento_tipo': {
                await i.deferUpdate();
                const isAdmin = !!(i.memberPermissions?.has('Administrator'));
                if (!isAdmin) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Acesso Negado', 'Apenas administradores podem iniciar eventos.')] });
                    break;
                }
                const guildId = i.guildId ?? '';
                const { startWorldEvent, buildWorldEventsEmbed, buildWorldEventsButtons, getActiveWorldEvent } = await Promise.resolve().then(() => __importStar(require('../panels/world-events')));
                const result = await startWorldEvent(guildId, i.values[0]);
                const active = await getActiveWorldEvent(guildId);
                const embed = await buildWorldEventsEmbed(guildId);
                const btns = buildWorldEventsButtons(guildId, true, !!active);
                const fb = result.success
                    ? (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).successEmbed('🌎 Evento!', result.message)
                    : (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).errorEmbed('Evento', result.message);
                await i.editReply({ embeds: [fb, embed], components: btns });
                break;
            }
            default:
                await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Ação desconhecida', `Select RPG \`${action}\` não encontrado.`)] });
        }
    }
    catch (err) {
        console.error(`[RPG Select Error] action=${action}`, err);
        const errMsg = { embeds: [(0, embeds_1.errorEmbed)('Erro RPG', 'Ocorreu um erro. Tente novamente.')] };
        if (i.replied)
            await i.followUp({ ...errMsg, ephemeral: true }).catch(() => null);
        else if (i.deferred)
            await i.editReply(errMsg).catch(() => null);
        else
            await i.reply({ ...errMsg, ephemeral: true }).catch(() => null);
    }
}
//# sourceMappingURL=rpgSelectHandler.js.map