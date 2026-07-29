"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMOJIS = exports.COLORS = void 0;
exports.baseEmbed = baseEmbed;
exports.successEmbed = successEmbed;
exports.errorEmbed = errorEmbed;
exports.infoEmbed = infoEmbed;
exports.warningEmbed = warningEmbed;
exports.rankEmoji = rankEmoji;
exports.levelBar = levelBar;
exports.colorFromLevel = colorFromLevel;
const discord_js_1 = require("discord.js");
const botConfig_1 = require("./botConfig");
exports.COLORS = {
    PRIMARY: 0x9b59b6,
    SECONDARY: 0x8e44ad,
    SUCCESS: 0x27ae60,
    ERROR: 0xe74c3c,
    WARNING: 0xf39c12,
    INFO: 0x7d3c98,
    DARK: 0x4a235a,
    GOLD: 0xf1c40f,
};
exports.EMOJIS = {
    CROWN: '👑',
    SWORD: '⚔️',
    SHIELD: '🛡️',
    STAR: '⭐',
    TROPHY: '🏆',
    COINS: '🪙',
    LIGHTNING: '⚡',
    TICKET: '🎫',
    WARNING: '⚠️',
    CHECK: '✅',
    CROSS: '❌',
    CLOCK: '🕐',
    CHART: '📊',
    GIFT: '🎁',
    MEGAPHONE: '📢',
    SCROLL: '📜',
    SPARKLES: '✨',
    FIRE: '🔥',
    LEVEL: '🎯',
    XP: '💜',
    GEAR: '⚙️',
    HAMMER: '🔨',
    BELL: '🔔',
    LOCK: '🔒',
    UNLOCK: '🔓',
    PERSON: '👤',
    GROUP: '👥',
    PIN: '📌',
};
function baseEmbed(color) {
    const cfg = (0, botConfig_1.getBotConfig)();
    return new discord_js_1.EmbedBuilder()
        .setColor(color ?? cfg.primaryColor)
        .setTimestamp()
        .setFooter({ text: cfg.footerText, iconURL: cfg.botIconUrl ?? undefined });
}
function successEmbed(title, description) {
    return baseEmbed(exports.COLORS.SUCCESS)
        .setTitle(`${exports.EMOJIS.CHECK} ${title}`)
        .setDescription(description ?? null);
}
function errorEmbed(title, description) {
    return baseEmbed(exports.COLORS.ERROR)
        .setTitle(`${exports.EMOJIS.CROSS} ${title}`)
        .setDescription(description ?? null);
}
function infoEmbed(title, description) {
    return baseEmbed(exports.COLORS.INFO)
        .setTitle(`${exports.EMOJIS.SPARKLES} ${title}`)
        .setDescription(description ?? null);
}
function warningEmbed(title, description) {
    return baseEmbed(exports.COLORS.WARNING)
        .setTitle(`${exports.EMOJIS.WARNING} ${title}`)
        .setDescription(description ?? null);
}
function rankEmoji(rank) {
    const map = {
        Recruta: '🔰',
        Membro: '⭐',
        Veterano: '🌟',
        Elite: '💫',
        Capitão: '🛡️',
        Comandante: '⚔️',
        Líder: '👑',
    };
    return map[rank] ?? '🔰';
}
function levelBar(xp, xpNeeded, length = 10) {
    const filled = Math.min(length, Math.round((xp / xpNeeded) * length));
    return '█'.repeat(filled) + '░'.repeat(length - filled);
}
function colorFromLevel(level) {
    if (level >= 20)
        return exports.COLORS.GOLD;
    if (level >= 10)
        return exports.COLORS.SECONDARY;
    return exports.COLORS.PRIMARY;
}
//# sourceMappingURL=embeds.js.map