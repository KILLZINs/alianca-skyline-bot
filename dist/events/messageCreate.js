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
const client_1 = require("../database/client");
// BUG FIX: cooldown por guildId:userId em vez de só userId
const cooldowns = new Map();
const spamTrack = new Map();
const linkRegex = /https?:\/\/|discord\.gg\//i;
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
        if (message.author.bot || !message.guild || message.content.startsWith('/'))
            return;
        const guildId = message.guild.id;
        const authorId = message.author.id;
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
        if (config.featMissions)
            await Promise.all([
                // Diárias
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
                // Semanais
                client_1.prisma.weeklyMission.updateMany({
                    where: { memberId: authorId, guildId, type: 'enviar_mensagens_sem', weekStr, completed: false },
                    data: { progress: { increment: 1 } },
                }),
                client_1.prisma.weeklyMission.updateMany({
                    where: { memberId: authorId, guildId, type: 'ganhar_xp_semanal', weekStr, completed: false },
                    data: { progress: { increment: xpGain } },
                }),
            ]).catch(() => null);
        // Marcar missões concluídas (só se featMissions habilitado)
        if (!config.featMissions) {
            // skip mission completion tracking
        }
        else {
            client_1.prisma.dailyMission.findMany({ where: { memberId: authorId, guildId, dateStr, completed: false } })
                .then(pending => Promise.all(pending.filter(m => m.progress >= m.target).map(m => client_1.prisma.dailyMission.update({ where: { id: m.id }, data: { completed: true } })))).catch(() => null);
            // Marcar missões concluídas (semanais)
            client_1.prisma.weeklyMission.findMany({ where: { memberId: authorId, guildId, weekStr, completed: false } })
                .then(pending => Promise.all(pending.filter(m => m.progress >= m.target).map(m => client_1.prisma.weeklyMission.update({ where: { id: m.id }, data: { completed: true } })))).catch(() => null);
        } // end featMissions
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