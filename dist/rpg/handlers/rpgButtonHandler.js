"use strict";
// ═══════════════════════════════════════════════════════════════════════
// HANDLER DE BOTÕES RPG
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
exports.handleRpgButton = handleRpgButton;
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const character_1 = require("../services/character");
const profile_1 = require("../panels/profile");
const travel_1 = require("../panels/travel");
const dungeon_1 = require("../panels/dungeon");
const shop_1 = require("../panels/shop");
const guild_1 = require("../panels/guild");
const skills_1 = require("../panels/skills");
const inventario_1 = require("../panels/inventario");
const embeds_1 = require("../../utils/embeds");
// ─── Router principal ──────────────────────────────────────────────────────
async function handleRpgButton(i, action) {
    const discordId = i.user.id;
    const username = i.user.username;
    // Extrair parâmetros extras (ex: rpg:casamento_aceitar:proposalId)
    const fullAction = i.customId.split(':').slice(1).join(':'); // tudo após prefix "rpg:"
    const parts = fullAction.split(':');
    const baseAction = parts[0];
    const param1 = parts[1];
    try {
        switch (baseAction) {
            // ── Perfil ────────────────────────────────────────────────────────────
            case 'perfil': {
                await i.deferUpdate();
                let char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                char = await (0, character_1.applyPassiveEnergyRegen)(char);
                const stats = (0, character_1.computeStats)(char);
                await i.editReply({
                    embeds: [(0, profile_1.buildProfileEmbed)(char, stats)],
                    components: (0, profile_1.buildProfileButtons)(char),
                });
                break;
            }
            // ── Viajar ────────────────────────────────────────────────────────────
            case 'viajar': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const select = (0, travel_1.buildTravelSelect)(char);
                await i.editReply({
                    embeds: [(0, travel_1.buildTravelEmbed)(char)],
                    components: select ? [select, (0, travel_1.buildTravelBackButton)()] : [(0, travel_1.buildTravelBackButton)()],
                });
                break;
            }
            // ── Inventário ────────────────────────────────────────────────────────
            case 'inventario': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { embed, select } = await (0, inventario_1.buildInventarioEmbed)(char);
                const rows = select ? [select, (0, inventario_1.buildInventarioButtons)()] : [(0, inventario_1.buildInventarioButtons)()];
                await i.editReply({ embeds: [embed], components: rows });
                break;
            }
            // ── Pontos de atributo ────────────────────────────────────────────────
            case 'pontos': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const stats = (0, character_1.computeStats)(char);
                await i.editReply({
                    embeds: [(0, profile_1.buildPontosEmbed)(char, stats)],
                    components: [(0, profile_1.buildPontosSelect)(char.statPoints)],
                });
                break;
            }
            // ── Cidade ────────────────────────────────────────────────────────────
            case 'cidade': {
                await i.deferUpdate();
                await i.editReply({
                    embeds: [(0, profile_1.buildCidadeEmbed)()],
                    components: [(0, profile_1.buildCidadeButtons)(), (0, profile_1.buildCidadeButtons2)()],
                });
                break;
            }
            // ── Dungeon ───────────────────────────────────────────────────────────
            case 'dungeon': {
                await i.deferUpdate();
                let char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                char = await (0, character_1.applyPassiveEnergyRegen)(char);
                const select = (0, dungeon_1.buildDungeonSelect)(char);
                await i.editReply({
                    embeds: [(0, dungeon_1.buildDungeonEmbed)(char)],
                    components: select ? [select, (0, dungeon_1.buildDungeonButtons)(char)] : [(0, dungeon_1.buildDungeonButtons)(char)],
                });
                break;
            }
            // ── Batalha rápida aleatória ──────────────────────────────────────────
            case 'dungeon_aleatorio': {
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
                const { embed: battleEmbed, rows: battleRows } = await (0, dungeon_1.doBattleRandom)(char);
                // Track missão RPG: matar inimigos
                try {
                    const { trackRpgMission } = await Promise.resolve().then(() => __importStar(require('../../commands/utility/missoes')));
                    await trackRpgMission(discordId, i.guildId ?? '', 'matar_inimigos', 1);
                    await trackRpgMission(discordId, i.guildId ?? '', 'vencer_dungeon', 1);
                }
                catch { /* non-critical */ }
                await i.editReply({ embeds: [battleEmbed], components: battleRows });
                break;
            }
            // ── Boss dungeon ──────────────────────────────────────────────────────
            case 'dungeon_boss': {
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
                const { getBossesForLocation } = await Promise.resolve().then(() => __importStar(require('../constants/enemies')));
                const { getLocation } = await Promise.resolve().then(() => __importStar(require('../constants/locations')));
                const loc = getLocation(char.currentLocation);
                const bosses = getBossesForLocation(loc.id).filter(b => char.level >= b.minLevel);
                if (bosses.length === 0) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Boss', 'Nenhum boss disponível aqui no seu nível.')] });
                    return;
                }
                const boss = bosses[0];
                const { doBattleEnemy } = await Promise.resolve().then(() => __importStar(require('../panels/dungeon')));
                const { embed: bossEmbed, rows: bossRows } = await doBattleEnemy(char, boss.id);
                // Track boss kill mission
                try {
                    const { trackRpgMission } = await Promise.resolve().then(() => __importStar(require('../../commands/utility/missoes')));
                    await trackRpgMission(discordId, i.guildId ?? '', 'matar_boss_rpg', 1);
                    await trackRpgMission(discordId, i.guildId ?? '', 'matar_inimigos', 1);
                }
                catch { /* non-critical */ }
                await i.editReply({ embeds: [bossEmbed], components: bossRows });
                break;
            }
            // ── Habilidades ───────────────────────────────────────────────────────
            case 'habilidades': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { embed, select } = (0, skills_1.buildHabilidadesEmbed)(char);
                const rows = select ? [select, (0, skills_1.buildHabilidadesButtons)(char)] : [(0, skills_1.buildHabilidadesButtons)(char)];
                await i.editReply({ embeds: [embed], components: rows });
                break;
            }
            // ── Loja ──────────────────────────────────────────────────────────────
            case 'loja': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                await i.editReply({
                    embeds: [(0, shop_1.buildShopEmbed)(char)],
                    components: [(0, shop_1.buildShopCategorySelect)(), (0, shop_1.buildShopButtons)()],
                });
                break;
            }
            // ── Curandeiro ────────────────────────────────────────────────────────
            case 'curandeiro': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const stats = (0, character_1.computeStats)(char);
                const hpMissing = stats.maxHp - char.currentHp;
                const enMissing = stats.maxEnergy - char.currentEnergy;
                const cost = Math.floor((hpMissing + enMissing) * 0.5);
                if (hpMissing === 0 && enMissing === 0) {
                    await i.editReply({ embeds: [(0, embeds_1.infoEmbed)('🏥 Curandeiro', '✅ Você já está com HP e Energia no máximo!')], components: [(0, profile_1.buildCidadeButtons)(), (0, profile_1.buildCidadeButtons2)()] });
                    return;
                }
                if (char.gold < cost) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('🏥 Ouro Insuficiente', `Curar custa **${cost} ouro**.\nVocê tem apenas **${char.gold} ouro**.\n\n❤️ HP faltando: **${hpMissing}** | ⚡ Energia faltando: **${enMissing}**`)], components: [(0, profile_1.buildCidadeButtons)(), (0, profile_1.buildCidadeButtons2)()] });
                    return;
                }
                await client_1.prisma.rpgCharacter.update({
                    where: { discordId },
                    data: { currentHp: stats.maxHp, currentEnergy: stats.maxEnergy, gold: { decrement: cost }, lastRest: new Date() },
                });
                await i.editReply({
                    embeds: [(0, embeds_1.infoEmbed)('🏥 Curado!', `HP e Energia restaurados por **${cost} ouro**.\n❤️ HP: **${stats.maxHp}/${stats.maxHp}** | ⚡ Energia: **${stats.maxEnergy}/${stats.maxEnergy}**`)],
                    components: [(0, profile_1.buildCidadeButtons)(), (0, profile_1.buildCidadeButtons2)()],
                });
                break;
            }
            // ── Arena PvP ─────────────────────────────────────────────────────────
            case 'arena': {
                await i.deferUpdate();
                await i.editReply({
                    embeds: [(0, embeds_1.infoEmbed)('⚔️ Arena PvP', 'Para desafiar alguém, use:\n`/rpg pvp @usuario`\n\nOu aguarde oponentes aleatórios no canal de arena.')],
                    components: [(0, profile_1.buildCidadeButtons)(), (0, profile_1.buildCidadeButtons2)()],
                });
                break;
            }
            // ── Guilda ────────────────────────────────────────────────────────────
            case 'guild': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const membership = await client_1.prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
                await i.editReply({ embeds: [(0, guild_1.buildGuildMenuEmbed)(char)], components: [(0, guild_1.buildGuildMenuButtons)(!!membership)] });
                break;
            }
            case 'guild_info': {
                await i.deferUpdate();
                const membership = await client_1.prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
                if (!membership) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Guilda', 'Você não está em nenhuma guilda.')] });
                    return;
                }
                await i.editReply({ embeds: [await (0, guild_1.buildGuildInfoEmbed)(membership.guildId)], components: (0, guild_1.buildGuildInfoButtons)(membership.role) });
                break;
            }
            case 'guild_config': {
                const membership = await client_1.prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
                if (!membership || (membership.role !== 'Líder' && membership.role !== 'Vice-Líder')) {
                    if (i.deferred || i.replied)
                        await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas Líder ou Vice-Líder podem configurar.')] });
                    else
                        await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas Líder ou Vice-Líder podem configurar.')], ephemeral: true });
                    return;
                }
                await i.showModal((0, guild_1.guildConfigModal)());
                break;
            }
            case 'guild_depositar': {
                const membership = await client_1.prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
                if (!membership) {
                    if (i.deferred || i.replied)
                        await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Guilda', 'Você não está em nenhuma guilda.')] });
                    else
                        await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Guilda', 'Você não está em nenhuma guilda.')], ephemeral: true });
                    return;
                }
                await i.showModal((0, guild_1.guildDepositarModal)());
                break;
            }
            case 'guild_anuncio': {
                const membership = await client_1.prisma.rpgGuildMember.findUnique({ where: { characterId: discordId } });
                if (!membership || (membership.role !== 'Líder' && membership.role !== 'Vice-Líder')) {
                    if (i.deferred || i.replied)
                        await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas Líder ou Vice-Líder podem definir o aviso.')] });
                    else
                        await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas Líder ou Vice-Líder podem definir o aviso.')], ephemeral: true });
                    return;
                }
                await i.showModal((0, guild_1.guildAnuncioModal)());
                break;
            }
            case 'guild_criar': {
                await i.showModal((0, guild_1.criarGuildaModal)());
                break;
            }
            case 'guild_buscar': {
                await i.deferUpdate();
                await i.editReply({ embeds: [await (0, guild_1.buildGuildListEmbed)()], components: [(0, guild_1.buildGuildMenuButtons)(false)] });
                break;
            }
            case 'guild_sair': {
                await i.deferUpdate();
                const result = await (0, guild_1.leaveGuild)(discordId);
                await i.editReply({ embeds: [result.success ? (0, embeds_1.successEmbed)('Guilda', result.message) : (0, embeds_1.errorEmbed)('Erro', result.message)] });
                break;
            }
            // ── Forja ─────────────────────────────────────────────────────────────
            case 'forja': {
                await i.deferUpdate();
                const { buildForjaEmbed } = await Promise.resolve().then(() => __importStar(require('../panels/forja')));
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { embed, select } = buildForjaEmbed(char);
                await i.editReply({
                    embeds: [embed],
                    components: select ? [select, (0, profile_1.buildCidadeButtons)(), (0, profile_1.buildCidadeButtons2)()] : [(0, profile_1.buildCidadeButtons)(), (0, profile_1.buildCidadeButtons2)()],
                });
                break;
            }
            // ══════════════════════════════════════════════════════════════════════
            // 🐉 BOSS MUNDIAL
            // ══════════════════════════════════════════════════════════════════════
            case 'worldboss': {
                await i.deferUpdate();
                const { buildWorldBossEmbed, buildWorldBossButtons } = await Promise.resolve().then(() => __importStar(require('../panels/worldBoss')));
                const guildId = i.guildId ?? '';
                const member = i.member;
                const isAdmin = !!(member && 'permissions' in member && member.permissions.has?.(discord_js_1.PermissionFlagsBits.ManageGuild));
                const [bossEmbed, bossButtons] = await Promise.all([
                    buildWorldBossEmbed(guildId),
                    buildWorldBossButtons(guildId, isAdmin),
                ]);
                await i.editReply({ embeds: [bossEmbed], components: bossButtons });
                break;
            }
            case 'worldboss_atacar': {
                await i.deferUpdate();
                const { attackWorldBoss } = await Promise.resolve().then(() => __importStar(require('../services/worldBoss')));
                const { buildWorldBossEmbed, buildWorldBossButtons } = await Promise.resolve().then(() => __importStar(require('../panels/worldBoss')));
                const guildId = i.guildId ?? '';
                const result = await attackWorldBoss(discordId, username, guildId);
                if (!result.success) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Boss Mundial', result.message)] });
                    return;
                }
                // Track missão de atacar boss mundial
                try {
                    const { trackRpgMission } = await Promise.resolve().then(() => __importStar(require('../../commands/utility/missoes')));
                    await trackRpgMission(discordId, guildId, 'atacar_boss_mundial', 1);
                    await trackRpgMission(discordId, guildId, 'participar_boss_mundial', 1);
                }
                catch { /* non-critical */ }
                const member = i.member;
                const isAdmin = !!(member && 'permissions' in member && member.permissions.has?.(discord_js_1.PermissionFlagsBits.ManageGuild));
                const [updatedBossEmbed, updatedButtons] = await Promise.all([
                    buildWorldBossEmbed(guildId),
                    buildWorldBossButtons(guildId, isAdmin),
                ]);
                const attackResult = (0, embeds_1.infoEmbed)(result.bossDefeated ? '🏆 Boss Derrotado!' : '⚔️ Ataque!', result.message);
                await i.followUp({ embeds: [attackResult], ephemeral: true });
                await i.editReply({ embeds: [updatedBossEmbed], components: updatedButtons });
                break;
            }
            case 'worldboss_spawn': {
                // Verificar admin
                const member = i.member;
                const isAdmin = !!(member && 'permissions' in member && member.permissions.has?.(discord_js_1.PermissionFlagsBits.ManageGuild));
                if (!isAdmin) {
                    await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas administradores podem invocar o Boss Mundial.')], ephemeral: true });
                    return;
                }
                // Mostrar seleção de template
                await i.deferUpdate();
                const { buildWorldBossSpawnSelect } = await Promise.resolve().then(() => __importStar(require('../panels/worldBoss')));
                const { EmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
                const spawnEmbed = new EmbedBuilder()
                    .setColor(0xE74C3C)
                    .setTitle('🐉 Invocar Boss Mundial — Passo 1')
                    .setDescription('Escolha qual Boss Mundial deseja invocar para o servidor!');
                await i.editReply({ embeds: [spawnEmbed], components: [buildWorldBossSpawnSelect()] });
                break;
            }
            // ══════════════════════════════════════════════════════════════════════
            // 💍 CASAMENTO
            // ══════════════════════════════════════════════════════════════════════
            case 'casamento': {
                await i.deferUpdate();
                const { buildMarriageEmbed, buildMarriageButtons } = await Promise.resolve().then(() => __importStar(require('../panels/marriage')));
                const [marriageEmbed, marriageButtons] = await Promise.all([
                    buildMarriageEmbed(discordId, i.client),
                    buildMarriageButtons(discordId),
                ]);
                await i.editReply({ embeds: [marriageEmbed], components: marriageButtons });
                break;
            }
            case 'casamento_propor': {
                const { buildProposalModal } = await Promise.resolve().then(() => __importStar(require('../panels/marriage')));
                await i.showModal(buildProposalModal());
                break;
            }
            case 'casamento_aceitar': {
                await i.deferUpdate();
                const proposalId = param1;
                if (!proposalId) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'ID da proposta inválido.')] });
                    return;
                }
                const { acceptProposal } = await Promise.resolve().then(() => __importStar(require('../services/marriage')));
                const result = await acceptProposal(proposalId, discordId);
                // Notificar via DM o proponente
                if (result.success && result.proposerId) {
                    try {
                        const proposerUser = await i.client.users.fetch(result.proposerId);
                        await proposerUser.send(`💍 **${i.user.username}** aceitou sua proposta de casamento! 💒🎊`);
                    }
                    catch { /* DMs fechadas */ }
                }
                const { buildMarriageEmbed, buildMarriageButtons } = await Promise.resolve().then(() => __importStar(require('../panels/marriage')));
                const [marriageEmbed, marriageButtons] = await Promise.all([
                    buildMarriageEmbed(discordId, i.client),
                    buildMarriageButtons(discordId),
                ]);
                const feedbackEmbed = result.success ? (0, embeds_1.successEmbed)('💒 Casamento!', result.message) : (0, embeds_1.errorEmbed)('Erro', result.message);
                await i.editReply({ embeds: [feedbackEmbed, marriageEmbed], components: marriageButtons });
                break;
            }
            case 'casamento_rejeitar': {
                await i.deferUpdate();
                const proposalId = param1;
                if (!proposalId) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'ID da proposta inválido.')] });
                    return;
                }
                const { rejectProposal } = await Promise.resolve().then(() => __importStar(require('../services/marriage')));
                const result = await rejectProposal(proposalId, discordId);
                const { buildMarriageEmbed, buildMarriageButtons } = await Promise.resolve().then(() => __importStar(require('../panels/marriage')));
                const [marriageEmbed, marriageButtons] = await Promise.all([
                    buildMarriageEmbed(discordId, i.client),
                    buildMarriageButtons(discordId),
                ]);
                const feedbackEmbed = result.success ? (0, embeds_1.infoEmbed)('💔 Proposta Recusada', result.message) : (0, embeds_1.errorEmbed)('Erro', result.message);
                await i.editReply({ embeds: [feedbackEmbed, marriageEmbed], components: marriageButtons });
                break;
            }
            case 'casamento_divorciar_confirmar': {
                await i.deferUpdate();
                const { buildDivorceConfirmEmbed } = await Promise.resolve().then(() => __importStar(require('../panels/marriage')));
                const confirmRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:casamento_divorciar_executar').setLabel('💔 Confirmar Divórcio').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('rpg:casamento').setLabel('❌ Cancelar').setStyle(discord_js_1.ButtonStyle.Secondary));
                await i.editReply({ embeds: [buildDivorceConfirmEmbed()], components: [confirmRow] });
                break;
            }
            case 'casamento_divorciar_executar': {
                await i.deferUpdate();
                const { divorce } = await Promise.resolve().then(() => __importStar(require('../services/marriage')));
                const result = await divorce(discordId);
                const { buildMarriageEmbed, buildMarriageButtons } = await Promise.resolve().then(() => __importStar(require('../panels/marriage')));
                const [marriageEmbed, marriageButtons] = await Promise.all([
                    buildMarriageEmbed(discordId, i.client),
                    buildMarriageButtons(discordId),
                ]);
                const feedbackEmbed = result.success ? (0, embeds_1.infoEmbed)('💔 Divórcio', result.message) : (0, embeds_1.errorEmbed)('Erro', result.message);
                await i.editReply({ embeds: [feedbackEmbed, marriageEmbed], components: marriageButtons });
                break;
            }
            // ══════════════════════════════════════════════════════════════════════
            // 📋 MISSÕES
            // ══════════════════════════════════════════════════════════════════════
            case 'missoes': {
                await i.deferUpdate();
                const guildId = i.guildId ?? '';
                const { ensureDailyMissions, ensureWeeklyMissions } = await Promise.resolve().then(() => __importStar(require('../../commands/utility/missoes')));
                const { buildMissoesEmbed, buildMissoesClaimSelect, buildMissoesButtons } = await Promise.resolve().then(() => __importStar(require('../panels/missoes')));
                await Promise.all([
                    ensureDailyMissions(discordId, guildId),
                    ensureWeeklyMissions(discordId, guildId),
                ]);
                const [missoesEmbed, claimSelect] = await Promise.all([
                    buildMissoesEmbed(discordId, guildId),
                    buildMissoesClaimSelect(discordId, guildId),
                ]);
                const missaoRows = claimSelect ? [claimSelect, buildMissoesButtons()] : [buildMissoesButtons()];
                await i.editReply({ embeds: [missoesEmbed], components: missaoRows });
                break;
            }
            // ── Estatísticas do Personagem ────────────────────────────────────────
            case 'stats': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const stats = (0, character_1.computeStats)(char);
                const totalBattles = char.totalWins + char.totalDeaths;
                const winRate = totalBattles > 0 ? Math.round((char.totalWins / totalBattles) * 100) : 0;
                const daysPlaying = Math.floor((Date.now() - char.createdAt.getTime()) / 86400000);
                const pvpTotal = char.pvpWins + char.pvpLosses;
                const pvpRate = pvpTotal > 0 ? Math.round((char.pvpWins / pvpTotal) * 100) : 0;
                const { EmbedBuilder: StatsEB, ActionRowBuilder: StatsAR, ButtonBuilder: StatsBB, ButtonStyle: StatsBS } = await Promise.resolve().then(() => __importStar(require('discord.js')));
                const { getClass: getClsStats } = await Promise.resolve().then(() => __importStar(require('../constants/classes')));
                const clsStats = getClsStats(char.class);
                const statsEmbed = new StatsEB()
                    .setColor(clsStats?.color ?? 0x2ECC71)
                    .setTitle(`📊 Estatísticas — ${char.username}`)
                    .setDescription(`${clsStats?.emoji ?? '⚔️'} **${clsStats?.name ?? char.class}** • Nível **${char.level}** • Geração **${char.generation}**`)
                    .addFields({
                    name: '⚔️ Batalhas PvE',
                    value: [
                        `Total: **${totalBattles}** batalhas`,
                        `Vitórias: **${char.totalWins}** | Derrotas: **${char.totalDeaths}**`,
                        `Taxa de vitória: **${winRate}%**`,
                    ].join('\n'),
                    inline: true,
                }, {
                    name: '👹 Monstros',
                    value: `Mortos: **${char.totalKills}**\nBosses: **${char.bossKills}**`,
                    inline: true,
                }, {
                    name: '⚔️ PvP',
                    value: `Vitórias: **${char.pvpWins}** / Derrotas: **${char.pvpLosses}**\nTaxa PvP: **${pvpRate}%**`,
                    inline: true,
                }, {
                    name: '📈 Poder de Combate',
                    value: `**${stats.combatPower.toLocaleString('pt-BR')}** PC`,
                    inline: true,
                }, {
                    name: '💰 Ouro em Carteira',
                    value: `**${char.gold.toLocaleString('pt-BR')}**`,
                    inline: true,
                }, {
                    name: '📅 Na Aliança há',
                    value: `**${daysPlaying}** dia(s)`,
                    inline: true,
                })
                    .setFooter({ text: `⚔️ Aliança Skyline RPG • Desde: ${char.createdAt.toISOString().slice(0, 10)}` });
                await i.editReply({
                    embeds: [statsEmbed],
                    components: [new StatsAR().addComponents(new StatsBB().setCustomId('rpg:perfil').setLabel('◀ Perfil').setStyle(StatsBS.Secondary), new StatsBB().setCustomId('rpg:stats').setLabel('🔄 Atualizar').setStyle(StatsBS.Secondary))],
                });
                break;
            }
            // ── 🧘 Meditar ───────────────────────────────────────────────────────
            case 'meditar': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { buildMeditarEmbed, buildMeditarButtons } = await Promise.resolve().then(() => __importStar(require('../panels/meditar')));
                await i.editReply({ embeds: [buildMeditarEmbed(char)], components: buildMeditarButtons(char) });
                break;
            }
            case 'meditar_rapida':
            case 'meditar_media':
            case 'meditar_profunda': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { startMeditation, buildMeditarEmbed, buildMeditarButtons } = await Promise.resolve().then(() => __importStar(require('../panels/meditar')));
                const optId = baseAction.replace('meditar_', '');
                const result = await startMeditation(char, optId);
                const updatedChar = await (0, character_1.getOrCreateCharacter)(discordId, username);
                if (!result.success) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Meditação', result.message)], components: buildMeditarButtons(char) });
                }
                else {
                    await i.editReply({ embeds: [buildMeditarEmbed(updatedChar)], components: buildMeditarButtons(updatedChar) });
                }
                break;
            }
            case 'meditar_coletar': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { collectMeditation, buildMeditarEmbed, buildMeditarButtons } = await Promise.resolve().then(() => __importStar(require('../panels/meditar')));
                const result = await collectMeditation(char);
                if (!result.success) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Meditação', result.message)] });
                }
                else {
                    const updatedChar = await (0, character_1.getOrCreateCharacter)(discordId, username);
                    const parts = [`❤️ +${result.hpGained} HP`, `⚡ +${result.energyGained} Energia`];
                    if (result.buffGiven)
                        parts.push('✨ +15% XP (1h)');
                    const resultEmbed = new (await Promise.resolve().then(() => __importStar(require('discord.js')))).EmbedBuilder()
                        .setColor(0x9B59B6).setTitle('🧘 Meditação Concluída!')
                        .setDescription(parts.join(' | '));
                    await i.editReply({ embeds: [resultEmbed, buildMeditarEmbed(updatedChar)], components: buildMeditarButtons(updatedChar) });
                }
                break;
            }
            // ── 🥊 Treinar ────────────────────────────────────────────────────────
            case 'treinar': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { buildTreinarEmbed, buildTreinarSelect, buildTreinarButtons } = await Promise.resolve().then(() => __importStar(require('../panels/treinar')));
                const lastTrain = char.lastTrain;
                const onCd = lastTrain && (Date.now() - lastTrain.getTime()) < 20 * 60 * 1000;
                const embed = await buildTreinarEmbed(char);
                await i.editReply({ embeds: [embed], components: [buildTreinarSelect(!!onCd), buildTreinarButtons()] });
                break;
            }
            // ── 🍺 Taverna ────────────────────────────────────────────────────────
            case 'taverna': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { buildTavernaEmbed, buildTavernaMenuSelect, buildTavernaButtons } = await Promise.resolve().then(() => __importStar(require('../panels/taverna')));
                await i.editReply({ embeds: [await buildTavernaEmbed(char)], components: [buildTavernaMenuSelect(), buildTavernaButtons()] });
                break;
            }
            case 'taverna_dados': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { rollTavernaDice, buildTavernaButtons } = await Promise.resolve().then(() => __importStar(require('../panels/taverna')));
                const { embed } = await rollTavernaDice(char);
                await i.editReply({ embeds: [embed], components: [buildTavernaButtons()] });
                break;
            }
            // ── 🎣 Pescaria ───────────────────────────────────────────────────────
            case 'pescaria': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { buildPescariaEmbed, buildPescariaButtons } = await Promise.resolve().then(() => __importStar(require('../panels/pescaria')));
                const { prisma: db } = await Promise.resolve().then(() => __importStar(require('../../database/client')));
                const session = await db.rpgFishingSession.findUnique({ where: { discordId } });
                const isReady = !!(session && session.reelableAt <= new Date());
                await i.editReply({
                    embeds: [await buildPescariaEmbed(char)],
                    components: buildPescariaButtons(char, !!session, isReady),
                });
                break;
            }
            case 'pesca_lancar': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { castFishingLine, buildPescariaEmbed, buildPescariaButtons } = await Promise.resolve().then(() => __importStar(require('../panels/pescaria')));
                const result = await castFishingLine(char);
                if (!result.success) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Pesca', result.message)] });
                }
                else {
                    const updatedChar = await (0, character_1.getOrCreateCharacter)(discordId, username);
                    const { prisma: db } = await Promise.resolve().then(() => __importStar(require('../../database/client')));
                    const session = await db.rpgFishingSession.findUnique({ where: { discordId } });
                    await i.editReply({
                        embeds: [await buildPescariaEmbed(updatedChar)],
                        components: buildPescariaButtons(updatedChar, !!session, false),
                    });
                }
                break;
            }
            case 'pesca_puxar': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { reelFishingLine, buildPescariaEmbed, buildPescariaButtons } = await Promise.resolve().then(() => __importStar(require('../panels/pescaria')));
                const result = await reelFishingLine(char);
                if (!result.success) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Pesca', result.message)] });
                }
                else {
                    const updatedChar = await (0, character_1.getOrCreateCharacter)(discordId, username);
                    await i.editReply({
                        embeds: [result.embed],
                        components: buildPescariaButtons(updatedChar, false, false),
                    });
                }
                break;
            }
            // ── 🌍 Exploração ─────────────────────────────────────────────────────
            case 'exploracao': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { buildExploracaoEmbed, buildExploracaoButtons } = await Promise.resolve().then(() => __importStar(require('../panels/exploracao')));
                const lastExplore = char.lastExplore;
                const onCd = !!(lastExplore && (Date.now() - lastExplore.getTime()) < 3 * 60 * 1000);
                await i.editReply({ embeds: [await buildExploracaoEmbed(char)], components: buildExploracaoButtons(onCd) });
                break;
            }
            case 'explorar': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { doExplore, buildExploracaoEmbed, buildExploracaoButtons } = await Promise.resolve().then(() => __importStar(require('../panels/exploracao')));
                const result = await doExplore(char);
                if (!result.success) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Exploração', result.message)] });
                }
                else {
                    await i.editReply({ embeds: [result.embed], components: buildExploracaoButtons(true) });
                }
                break;
            }
            // ── 🌎 Eventos de Mundo ───────────────────────────────────────────────
            case 'eventos': {
                await i.deferUpdate();
                const guildId = i.guildId ?? '';
                const { buildWorldEventsEmbed, buildWorldEventsButtons, getActiveWorldEvent } = await Promise.resolve().then(() => __importStar(require('../panels/world-events')));
                const active = await getActiveWorldEvent(guildId);
                const isAdmin = !!(i.memberPermissions?.has('Administrator'));
                const embed = await buildWorldEventsEmbed(guildId);
                const btns = buildWorldEventsButtons(guildId, isAdmin, !!active);
                await i.editReply({ embeds: [embed], components: btns });
                break;
            }
            case 'evento_iniciar': {
                await i.deferUpdate();
                const isAdmin = !!(i.memberPermissions?.has('Administrator'));
                if (!isAdmin) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Acesso Negado', 'Apenas administradores podem iniciar eventos.')] });
                    break;
                }
                const { buildEventStartSelect, buildWorldEventsEmbed } = await Promise.resolve().then(() => __importStar(require('../panels/world-events')));
                const guildId = i.guildId ?? '';
                const embed = await buildWorldEventsEmbed(guildId);
                await i.editReply({ embeds: [embed], components: [buildEventStartSelect()] });
                break;
            }
            case 'evento_atacar_boss': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                if (char.currentHp <= 0) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem HP', 'Cure-se antes de atacar o boss!')] });
                    break;
                }
                if (char.currentEnergy < 10) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Sem Energia', 'Precisa de 10⚡ para atacar!')] });
                    break;
                }
                const { damageWorldBoss, buildWorldEventsEmbed, buildWorldEventsButtons, getActiveWorldEvent } = await Promise.resolve().then(() => __importStar(require('../panels/world-events')));
                const guildId = i.guildId ?? '';
                const stats = (0, character_1.computeStats)(char);
                const dmg = Math.max(10, Math.floor(stats.attack * (0.5 + Math.random() * 0.5)));
                await client_1.prisma.rpgCharacter.update({ where: { discordId }, data: { currentEnergy: Math.max(0, char.currentEnergy - 15) } });
                const result = await damageWorldBoss(guildId, discordId, dmg);
                const active = await getActiveWorldEvent(guildId);
                const embed = await buildWorldEventsEmbed(guildId);
                const btns = buildWorldEventsButtons(guildId, true, !!active);
                const fb = result.killed
                    ? (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).successEmbed('💀 Boss Derrotado!', result.message)
                    : (await Promise.resolve().then(() => __importStar(require('../../utils/embeds')))).infoEmbed('⚔️ Ataque', result.message);
                await i.editReply({ embeds: [fb, embed], components: btns });
                break;
            }
            // ── 📜 Missões de Classe ──────────────────────────────────────────────
            case 'missoes_classe': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { buildClassMissionsEmbed, buildClassMissionsClaimSelect, buildClassMissionsButtons } = await Promise.resolve().then(() => __importStar(require('../panels/class-missions')));
                const embed = await buildClassMissionsEmbed(char);
                const claimSel = await buildClassMissionsClaimSelect(discordId);
                const rows = claimSel ? [claimSel, buildClassMissionsButtons()] : [buildClassMissionsButtons()];
                await i.editReply({ embeds: [embed], components: rows });
                break;
            }
            // ── ⚔️ Dungeon por tipo ────────────────────────────────────────────────
            case 'dungeon_tipo': {
                await i.deferUpdate();
                const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
                const { buildDungeonTypeEmbed, buildDungeonTypeSelect, buildDungeonTypeButtons } = await Promise.resolve().then(() => __importStar(require('../panels/dungeon-tipo')));
                await i.editReply({ embeds: [buildDungeonTypeEmbed(char)], components: [buildDungeonTypeSelect(char), buildDungeonTypeButtons()] });
                break;
            }
            default:
                if (i.deferred || i.replied) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Ação desconhecida', `Ação RPG \`${baseAction}\` não encontrada.`)] });
                }
                else {
                    await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Ação desconhecida', `Ação RPG \`${baseAction}\` não encontrada.`)], ephemeral: true });
                }
        }
    }
    catch (err) {
        console.error(`[RPG Button Error] action=${baseAction}`, err);
        const errMsg = { embeds: [(0, embeds_1.errorEmbed)('Erro RPG', 'Ocorreu um erro. Tente novamente.')] };
        if (i.replied)
            await i.followUp({ ...errMsg, ephemeral: true }).catch(() => null);
        else if (i.deferred)
            await i.editReply(errMsg).catch(() => null);
        else
            await i.reply({ ...errMsg, ephemeral: true }).catch(() => null);
    }
}
//# sourceMappingURL=rpgButtonHandler.js.map