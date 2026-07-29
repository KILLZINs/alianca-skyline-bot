"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAllowlist = loadAllowlist;
exports.isEnforcementActive = isEnforcementActive;
exports.isGuildAllowed = isGuildAllowed;
exports.getOwnerIds = getOwnerIds;
exports.isBotOwner = isBotOwner;
exports.isBotManager = isBotManager;
exports.cacheAddGuild = cacheAddGuild;
exports.cacheRemoveGuild = cacheRemoveGuild;
exports.cacheAddManager = cacheAddManager;
exports.cacheRemoveManager = cacheRemoveManager;
exports.allowedGuildCount = allowedGuildCount;
const client_1 = require("../database/client");
// ─── In-memory cache ──────────────────────────────────────────────────────────
const allowedSet = new Set();
const managerSet = new Set();
let cacheLoaded = false;
// ─── Bootstrap ────────────────────────────────────────────────────────────────
/** Load allowlist + managers from DB. Call once on ready. */
async function loadAllowlist() {
    const [guilds, managers] = await Promise.all([
        client_1.prisma.allowedGuild.findMany({ where: { active: true } }),
        client_1.prisma.botManager.findMany(),
    ]);
    allowedSet.clear();
    managerSet.clear();
    for (const g of guilds)
        allowedSet.add(g.guildId);
    for (const m of managers)
        managerSet.add(m.userId);
    cacheLoaded = true;
}
// ─── Checks ───────────────────────────────────────────────────────────────────
/** Enforcement is active only once at least one guild has been added. */
function isEnforcementActive() {
    return cacheLoaded && allowedSet.size > 0;
}
/** Returns true if the guild may use the bot. */
function isGuildAllowed(guildId) {
    return !isEnforcementActive() || allowedSet.has(guildId);
}
/** Returns all owner IDs from env (supports BOT_OWNER_IDS csv + legacy OWNER_ID). */
function getOwnerIds() {
    const ids = new Set();
    (process.env.BOT_OWNER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean).forEach(id => ids.add(id));
    if (process.env.OWNER_ID)
        ids.add(process.env.OWNER_ID.trim());
    return [...ids];
}
function isBotOwner(userId) {
    return getOwnerIds().includes(userId);
}
function isBotManager(userId) {
    return isBotOwner(userId) || managerSet.has(userId);
}
// ─── Cache mutators ───────────────────────────────────────────────────────────
function cacheAddGuild(guildId) { allowedSet.add(guildId); }
function cacheRemoveGuild(guildId) { allowedSet.delete(guildId); }
function cacheAddManager(userId) { managerSet.add(userId); }
function cacheRemoveManager(userId) { managerSet.delete(userId); }
function allowedGuildCount() { return allowedSet.size; }
//# sourceMappingURL=allowlist.js.map