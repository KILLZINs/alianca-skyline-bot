"use strict";
// ═══════════════════════════════════════════════════════════════════════
// COMANDO /rpg — Ponto de entrada do sistema RPG
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
const discord_js_1 = require("discord.js");
const character_1 = require("../rpg/services/character");
const profile_1 = require("../rpg/panels/profile");
const classes_1 = require("../rpg/constants/classes");
const combat_1 = require("../rpg/services/combat");
const embeds_1 = require("../utils/embeds");
const client_1 = require("../database/client");
exports.default = {
    category: 'rpg',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('rpg')
        .setDescription('Sistema RPG da Aliança Skyline')
        .addSubcommand(sub => sub.setName('perfil').setDescription('Ver seu perfil RPG'))
        .addSubcommand(sub => sub.setName('start').setDescription('Criar seu personagem RPG'))
        .addSubcommand(sub => sub.setName('pvp').setDescription('Desafiar outro jogador').addUserOption(o => o.setName('alvo').setDescription('Jogador a desafiar').setRequired(true)))
        .addSubcommand(sub => sub.setName('rank').setDescription('Ranking de poder de combate'))
        .addSubcommand(sub => sub.setName('reencarnar').setDescription('Reencarnar (nível 50+)'))
        .addSubcommand(sub => sub.setName('info').setDescription('Info sobre uma classe').addStringOption(o => o.setName('classe').setDescription('ID da classe').setRequired(true))),
    async execute(interaction) {
        // Feature gate
        const { isFeatureEnabled, featureDisabledMsg } = await Promise.resolve().then(() => __importStar(require('../utils/features')));
        if (interaction.guildId && !(await isFeatureEnabled(interaction.guildId, 'featRpg'))) {
            return interaction.reply({ content: featureDisabledMsg('featRpg'), ephemeral: true });
        }
        const sub = interaction.options.getSubcommand();
        const discordId = interaction.user.id;
        const username = interaction.user.username;
        // ── /rpg perfil ──────────────────────────────────────────────────────────
        if (sub === 'perfil') {
            await interaction.deferReply({ ephemeral: true });
            const char = await (0, character_1.getOrCreateCharacter)(discordId, username);
            const stats = (0, character_1.computeStats)(char);
            await interaction.editReply({
                embeds: [(0, profile_1.buildProfileEmbed)(char, stats)],
                components: (0, profile_1.buildProfileButtons)(char),
            });
            return;
        }
        // ── /rpg start ───────────────────────────────────────────────────────────
        if (sub === 'start') {
            await interaction.deferReply({ ephemeral: true });
            const existing = await (0, character_1.getCharacter)(discordId);
            if (existing) {
                const stats = (0, character_1.computeStats)(existing);
                await interaction.editReply({
                    content: '> Você já tem um personagem! Aqui está seu perfil:',
                    embeds: [(0, profile_1.buildProfileEmbed)(existing, stats)],
                    components: (0, profile_1.buildProfileButtons)(existing),
                });
                return;
            }
            // Seleção de classe
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('⚔️ Bem-vindo ao RPG da Aliança Skyline!')
                .setDescription('Escolha sua classe inicial para começar sua jornada.\n' +
                'Você poderá evoluir para classes avançadas ao atingir nível 20!\n\n' +
                classes_1.TIER1_CLASSES.map(c => `${c.emoji} **${c.name}** — ${c.description}\n> FOR:${c.baseStats.str} AGI:${c.baseStats.agi} INT:${c.baseStats.int} VIT:${c.baseStats.vit} SOR:${c.baseStats.lck}`).join('\n\n'))
                .setFooter({ text: '⚔️ Aliança Skyline RPG — Escolha com sabedoria!' });
            const select = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
                .setCustomId('rpg_select:escolher_classe')
                .setPlaceholder('Selecione sua classe inicial...')
                .addOptions(classes_1.TIER1_CLASSES.map(c => new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel(`${c.name}`)
                .setValue(`start_class:${c.id}`)
                .setEmoji(c.emoji.trim())
                .setDescription(c.description.slice(0, 100)))));
            await interaction.editReply({ embeds: [embed], components: [select] });
            return;
        }
        // ── /rpg pvp ─────────────────────────────────────────────────────────────
        if (sub === 'pvp') {
            await interaction.deferReply({ ephemeral: false });
            const target = interaction.options.getUser('alvo', true);
            if (target.id === discordId) {
                await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('PvP', 'Você não pode lutar contra si mesmo!')] });
                return;
            }
            if (target.bot) {
                await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('PvP', 'Bots não participam de PvP!')] });
                return;
            }
            const [attacker, defender] = await Promise.all([
                (0, character_1.getCharacter)(discordId),
                (0, character_1.getCharacter)(target.id),
            ]);
            if (!attacker) {
                await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('PvP', 'Você ainda não criou seu personagem! Use `/rpg start`.')] });
                return;
            }
            if (!defender) {
                await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('PvP', `**${target.username}** ainda não tem personagem RPG.`)] });
                return;
            }
            if (!attacker.pvpEnabled || !defender.pvpEnabled) {
                await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('PvP', 'Um dos jogadores está com PvP desativado.')] });
                return;
            }
            const pvpCd = attacker.lastPvp && (Date.now() - attacker.lastPvp.getTime()) < 10 * 60 * 1000;
            if (pvpCd) {
                await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('Cooldown PvP', 'Aguarde 10 minutos entre batalhas PvP.')] });
                return;
            }
            const pvpResult = await (0, combat_1.runPvp)(attacker, defender);
            const color = pvpResult.winner === discordId ? 0x27AE60 : 0xE74C3C;
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(color)
                .setTitle('⚔️ Resultado do PvP')
                .setDescription(pvpResult.log.slice(-10).join('\n'))
                .addFields({ name: '🏆 Vencedor', value: `<@${pvpResult.winner}>`, inline: true }, { name: '⭐ XP Ganho', value: `+${pvpResult.xpGained}`, inline: true }, { name: '💰 Ouro', value: `+${pvpResult.goldStolen}`, inline: true });
            await interaction.editReply({ embeds: [embed] });
            return;
        }
        // ── /rpg rank ─────────────────────────────────────────────────────────────
        if (sub === 'rank') {
            await interaction.deferReply({ ephemeral: true });
            const top = await client_1.prisma.rpgCharacter.findMany({
                orderBy: { level: 'desc' },
                take: 15,
            });
            const { getClass } = await Promise.resolve().then(() => __importStar(require('../rpg/constants/classes')));
            const { computeStats: cStats } = await Promise.resolve().then(() => __importStar(require('../rpg/services/character')));
            const lines = top.map((c, i) => {
                const cls = getClass(c.class);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
                return `${medal} **${c.username}** — Nv.${c.level} ${cls?.emoji ?? ''} ${cls?.name ?? c.class}`;
            }).join('\n') || '*Nenhum personagem ainda.*';
            await interaction.editReply({
                embeds: [new discord_js_1.EmbedBuilder()
                        .setColor(0xF1C40F)
                        .setTitle('🏆 Ranking RPG — Top Aventureiros')
                        .setDescription(lines)
                        .setFooter({ text: '⚔️ Aliança Skyline RPG' })],
            });
            return;
        }
        // ── /rpg reencarnar ──────────────────────────────────────────────────────
        if (sub === 'reencarnar') {
            await interaction.deferReply({ ephemeral: true });
            const { reincarnate } = await Promise.resolve().then(() => __importStar(require('../rpg/services/character')));
            const result = await reincarnate(discordId);
            await interaction.editReply({
                embeds: [result.success ? (0, embeds_1.successEmbed)('Reencarnação', result.message) : (0, embeds_1.errorEmbed)('Erro', result.message)],
            });
            return;
        }
        // ── /rpg info <classe> ───────────────────────────────────────────────────
        if (sub === 'info') {
            await interaction.deferReply({ ephemeral: true });
            const classId = interaction.options.getString('classe', true).toLowerCase();
            const { getClass } = await Promise.resolve().then(() => __importStar(require('../rpg/constants/classes')));
            const cls = getClass(classId);
            if (!cls) {
                await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('Classe não encontrada', 'ID de classe inválido.')] });
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(cls.color)
                .setTitle(`${cls.emoji} ${cls.name} — Tier ${cls.tier}`)
                .setDescription(`*${cls.lore}*`)
                .addFields({ name: '📊 Raridade', value: cls.rarity, inline: true }, { name: '📈 Stat Principal', value: cls.primaryStat.toUpperCase(), inline: true }, { name: '🗡️ Armas', value: cls.weaponTypes.join(', '), inline: false }, { name: '📊 Stats Base', value: `FOR:${cls.baseStats.str} AGI:${cls.baseStats.agi} INT:${cls.baseStats.int} VIT:${cls.baseStats.vit} SOR:${cls.baseStats.lck}`, inline: false }, { name: '📈 Crescimento/nível', value: `FOR:+${cls.statGrowthPerLevel.str} AGI:+${cls.statGrowthPerLevel.agi} INT:+${cls.statGrowthPerLevel.int} VIT:+${cls.statGrowthPerLevel.vit} SOR:+${cls.statGrowthPerLevel.lck}`, inline: false }, { name: '❤️ HP Base', value: `${cls.baseHp} (+${cls.hpPerVit}/VIT)`, inline: true }, { name: '⚡ Energia Base', value: `${cls.baseEnergy} (+${cls.energyPerLevel}/nível)`, inline: true }, ...(cls.evolveFrom ? [{ name: '🔓 Evolui de', value: cls.evolveFrom, inline: true }] : []));
            await interaction.editReply({ embeds: [embed] });
            return;
        }
    },
};
//# sourceMappingURL=rpg.js.map