"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateMember = getOrCreateMember;
exports.addXp = addXp;
exports.getConfig = getConfig;
exports.formatDuration = formatDuration;
exports.parseDuration = parseDuration;
const client_1 = require("../database/client");
const types_1 = require("../types");
async function getOrCreateMember(discordId, username) {
    return client_1.prisma.member.upsert({
        where: { discordId },
        update: { username },
        create: { discordId, username },
    });
}
async function addXp(discordId, username, amount) {
    const member = await getOrCreateMember(discordId, username);
    let xp = member.xp + amount;
    let level = member.level;
    // BUG FIX: usar loop para suportar múltiplos level-ups em uma única chamada
    while (xp >= (0, types_1.xpForNextLevel)(level)) {
        xp -= (0, types_1.xpForNextLevel)(level);
        level++;
    }
    return client_1.prisma.member.update({
        where: { discordId },
        data: { xp, level },
    });
}
async function getConfig(guildId) {
    return client_1.prisma.guildConfig.upsert({
        where: { guildId },
        update: {},
        create: { guildId },
    });
}
function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0)
        return `${d}d ${h % 24}h`;
    if (h > 0)
        return `${h}h ${m % 60}m`;
    if (m > 0)
        return `${m}m ${s % 60}s`;
    return `${s}s`;
}
function parseDuration(str) {
    const match = str.match(/^(\d+)(s|m|h|d)$/i);
    if (!match)
        return null;
    const v = parseInt(match[1]);
    const u = match[2].toLowerCase();
    return v * ({ s: 1000, m: 60000, h: 3600000, d: 86400000 }[u] ?? 0);
}
//# sourceMappingURL=helpers.js.map