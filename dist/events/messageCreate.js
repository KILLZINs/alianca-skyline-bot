"use strict";
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
const helpers_1 = require("../utils/helpers");
const character_1 = require("../rpg/services/character");
const embeds_1 = require("../utils/embeds");
const types_1 = require("../types");
const botConfig_1 = require("../utils/botConfig");
const client_1 = require("../database/client");
const bryan_1 = require("../ai/bryan");
// BUG FIX: cooldown por guildId:userId em vez de só userId
const cooldowns = new Map();
const spamTrack = new Map();
const linkRegex = /https?:\/\/|discord\.gg\//i;
// ─── Prefix & Bryan ──────────────────────────────────────────────────────────
const PREFIX = 'b '; // ex: "b ping", "b ajuda"
const BRYAN_REGEX = /^bryan[,!.?:\s]/i;
const bryanCooldowns = new Map();
function today() { return new Date().toISOString().slice(0, 10); }
function thisWeek() {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}
exports.default = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        if (message.author.bot || !message.guild)
            return;
        const guildId = message.guild.id;
        const authorId = message.author.id;
        const content = message.content.trim();
        // ─── AFK: remover status do autor ao enviar mensagem ─────────────────────
        if ((0, botConfig_1.getBotConfig)().featAfk) {
            try {
                const authorAfk = await client_1.prisma.afkStatus.findUnique({ where: { userId: authorId } });
                if (authorAfk) {
                    await client_1.prisma.afkStatus.delete({ where: { userId: authorId } });
                    const notify = await message.channel
                        .send({ content: `👋 ${message.author}, seu AFK foi removido!` }).catch(() => null);
                    if (notify)
                        setTimeout(() => notify.delete().catch(() => null), 5000);
                }
            }
            catch { /* tabela pode ainda não existir — ignora silenciosamente */ }
            // ─── AFK: notificar ao mencionar usuário em AFK ─────────────────────────
            if (message.mentions.users.size > 0) {
                for (const [, mentionedUser] of message.mentions.users) {
                    if (mentionedUser.bot || mentionedUser.id === authorId)
                        continue;
                    try {
                        const afk = await client_1.prisma.afkStatus.findUnique({ where: { userId: mentionedUser.id } });
                        if (!afk)
                            continue;
                        const since = Math.floor(afk.setAt.getTime() / 1000);
                        const warn = await message.channel.send({
                            embeds: [
                                new discord_js_1.EmbedBuilder()
                                    .setColor(embeds_1.COLORS.WARNING)
                                    .setTitle(`💤 ${mentionedUser.username} está em AFK`)
                                    .setDescription(`**Motivo:** ${afk.message}\n**Desde:** <t:${since}:R>`)
                                    .setFooter({ text: '⚔️ Aliança Skyline' }),
                            ],
                        }).catch(() => null);
                        if (warn)
                            setTimeout(() => warn.delete().catch(() => null), 8000);
                    }
                    catch { /* ignora */ }
                }
            }
        }
        // ─── Bryan I.A. ──────────────────────────────────────────────────────────
        // Ativado quando a mensagem começa com "Bryan" (ex: "Bryan, como entrar?")
        if (BRYAN_REGEX.test(content)) {
            const bryanKey = `${guildId}:${authorId}`;
            const now = Date.now();
            if (now - (bryanCooldowns.get(bryanKey) ?? 0) < 8000) {
                await message.reply('⏳ Espera um pouquinho antes de me chamar de novo!').catch(() => null);
                return;
            }
            bryanCooldowns.set(bryanKey, now);
            const userMessage = content.replace(/^bryan[,!.?:\s]*/i, '').trim();
            if (!userMessage) {
                await message.reply('👋 Oi! Me faz uma pergunta, pode falar!').catch(() => null);
                return;
            }
            await message.channel.sendTyping().catch(() => null);
            const displayName = (message.member?.displayName ?? message.author.username);
            const response = await (0, bryan_1.askBryan)(userMessage, displayName);
            await message.reply(response).catch(() => null);
            return;
        }
        // ─── Prefix commands ─────────────────────────────────────────────────────
        // "b <comando>" roteia para prefix-only OU slash commands existentes
        if (content.toLowerCase().startsWith(PREFIX)) {
            const args = content.slice(PREFIX.length).trim().split(/\s+/);
            const cmdName = args.shift()?.toLowerCase() ?? '';
            if (!cmdName)
                return;
            const extClient = message.client;
            // 1. Comandos prefix exclusivos (b ajuda, b info, etc.)
            const prefixCmd = extClient.prefixCommands?.get(cmdName);
            if (prefixCmd) {
                try {
                    await prefixCmd.execute(message, args);
                }
                catch (err) {
                    console.error(`[Prefix] Erro em ${cmdName}:`, err);
                    await message.reply('❌ Erro ao executar esse comando.').catch(() => null);
                }
                return;
            }
            // 2. Slash commands existentes via shim
            const slashCmd = extClient.commands?.get(cmdName);
            if (slashCmd) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { createMessageShim } = require('../utils/messageCommandShim');
                    const shim = createMessageShim(message, cmdName, args);
                    await slashCmd.execute(shim);
                }
                catch (err) {
                    console.error(`[Prefix→Slash] Erro em ${cmdName}:`, err);
                    await message.reply('❌ Erro ao executar esse comando.').catch(() => null);
                }
                return;
            }
            await message.reply(`❌ Comando \`${cmdName}\` não encontrado. Use \`b ajuda\` para ver os disponíveis.`).catch(() => null);
            return;
        }
        // Não processar mais nada para mensagens de slash command ou DMs
        if (message.content.startsWith('/'))
            return;
        const config = await (0, helpers_1.getConfig)(guildId);
        // ─── Track daily message count ────────────────────────────────────────────
        client_1.prisma.serverStat.upsert({
            where: { guildId_date: { guildId, date: today() } },
            update: { messages: { increment: 1 } },
            create: { guildId, date: today(), messages: 1 },
        }).catch(() => null);
        // ─── Anti-spam ────────────────────────────────────────────────────────────
        if (config.antiSpam) {
            const key = `${guildId}:${authorId}`;
            const now = Date.now();
            const entry = spamTrack.get(key) ?? { count: 0, reset: now + 5000 };
            if (now > entry.reset) {
                entry.count = 0;
                entry.reset = now + 5000;
            }
            entry.count++;
            spamTrack.set(key, entry);
            if (entry.count > 5) {
                await message.delete().catch(() => null);
                const warn = await message.channel
                    .send({ content: `${message.author}, devagar! ⚠️ Anti-spam ativado.` }).catch(() => null);
                if (warn)
                    setTimeout(() => warn.delete().catch(() => null), 4000);
                return;
            }
        }
        // ─── Anti-links ───────────────────────────────────────────────────────────
        if (config.antiLinks && linkRegex.test(message.content)) {
            const mem = message.member;
            if (!mem?.permissions.has('ManageMessages')) {
                await message.delete().catch(() => null);
                const warn = await message.channel
                    .send({ content: `${message.author}, links não são permitidos aqui! 🔗` }).catch(() => null);
                if (warn)
                    setTimeout(() => warn.delete().catch(() => null), 4000);
                return;
            }
        }
        // ─── Feature gate: XP/Leveling ───────────────────────────────────────────
        if (!config.featLeveling)
            return;
        // ─── XP cooldown — chave por guildId:userId ───────────────────────────────
        const now = Date.now();
        const cdKey = `${guildId}:${authorId}`;
        const cooldownMs = (config.xpCooldown ?? 60) * 1000;
        if (now - (cooldowns.get(cdKey) ?? 0) < cooldownMs)
            return;
        cooldowns.set(cdKey, now);
        const xpMin = config.xpMin ?? 15;
        const xpMax = config.xpMax ?? 25;
        const xpGain = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;
        const before = await client_1.prisma.member.findUnique({ where: { discordId: authorId } });
        const after = await (0, helpers_1.addXp)(authorId, message.author.username, xpGain);
        // ─── RPG: regen de energia via chat (fire-and-forget) ────────────────────
        (0, character_1.applyChatEnergyRegen)(authorId).catch(() => null);
        // ─── Mission progress (only if featMissions enabled) ─────────────────────
        const dateStr = today();
        const weekStr = thisWeek();
        if (config.featMissions) {
            const { ensureDailyMissions, ensureWeeklyMissions } = await Promise.resolve().then(() => __importStar(require('../commands/utility/missoes')));
            await Promise.all([
                ensureDailyMissions(authorId, guildId),
                ensureWeeklyMissions(authorId, guildId),
            ]).catch(() => null);
        }
        if (config.featMissions)
            await Promise.all([
                client_1.prisma.dailyMission.updateMany({
                    where: { memberId: authorId, guildId, type: 'estar_online', dateStr, completed: false },
                    data: { progress: 1, completed: true },
                }),
                client_1.prisma.dailyMission.updateMany({
                    where: { memberId: authorId, guildId, type: 'enviar_mensagens', dateStr, completed: false },
                    data: { progress: { increment: 1 } },
                }),
                client_1.prisma.dailyMission.updateMany({
                    where: { memberId: authorId, guildId, type: 'ganhar_xp', dateStr, completed: false },
                    data: { progress: { increment: xpGain } },
                }),
                client_1.prisma.weeklyMission.updateMany({
                    where: { memberId: authorId, guildId, type: 'enviar_mensagens_sem', weekStr, completed: false },
                    data: { progress: { increment: 1 } },
                }),
                client_1.prisma.weeklyMission.updateMany({
                    where: { memberId: authorId, guildId, type: 'ganhar_xp_semanal', weekStr, completed: false },
                    data: { progress: { increment: xpGain } },
                }),
            ]).catch(() => null);
        if (!config.featMissions) {
            // skip mission completion tracking
        }
        else {
            client_1.prisma.dailyMission.findMany({ where: { memberId: authorId, guildId, dateStr, completed: false } })
                .then(pending => Promise.all(pending.filter(m => m.progress >= m.target).map(m => client_1.prisma.dailyMission.update({ where: { id: m.id }, data: { completed: true } })))).catch(() => null);
            client_1.prisma.weeklyMission.findMany({ where: { memberId: authorId, guildId, weekStr, completed: false } })
                .then(pending => Promise.all(pending.filter(m => m.progress >= m.target).map(m => client_1.prisma.weeklyMission.update({ where: { id: m.id }, data: { completed: true } })))).catch(() => null);
        }
        // ─── Level up ─────────────────────────────────────────────────────────────
        if (before && after.level > before.level) {
            client_1.prisma.levelReward.findUnique({ where: { guildId_level: { guildId, level: after.level } } })
                .then(async (reward) => {
                if (!reward)
                    return;
                if (reward.roleId)
                    await message.member?.roles.add(reward.roleId).catch(() => null);
                if (reward.coins > 0) {
                    await client_1.prisma.member.update({
                        where: { discordId: authorId },
                        data: { coins: { increment: reward.coins } },
                    });
                }
            }).catch(() => null);
            const channelId = config.levelUpChannelId ?? message.channel.id;
            const channel = message.guild.channels.cache.get(channelId);
            if (!channel)
                return;
            const { applyTemplate: applyLevelUpTemplate } = await Promise.resolve().then(() => __importStar(require('../utils/embedTemplates')));
            const embed = new discord_js_1.EmbedBuilder()
                .setColor((0, embeds_1.colorFromLevel)(after.level))
                .setTitle(`${embeds_1.EMOJIS.LEVEL} Level Up!`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Parabéns ${message.author}! Você subiu para o **Nível ${after.level}**! 🎉\n\n` +
                `\`${(0, embeds_1.levelBar)(after.xp, (0, types_1.xpForNextLevel)(after.level))}\``)
                .setFooter({ text: `⚔️ ${message.guild.name}` })
                .setTimestamp();
            applyLevelUpTemplate(embed, 'levelup');
            await channel.send({ embeds: [embed] }).catch(console.error);
        }
    },
};
//# sourceMappingURL=messageCreate.js.map