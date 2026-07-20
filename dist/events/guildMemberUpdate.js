"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
exports.default = {
    name: 'guildMemberUpdate',
    once: false,
    async execute(before, after) {
        const guild = after.guild;
        // ── Cargos ────────────────────────────────────────────────────────
        if (before.roles && after.roles) {
            const addedRoles = after.roles.cache.filter(r => !before.roles.cache.has(r.id) && r.id !== guild.id);
            const removedRoles = before.roles.cache.filter(r => !after.roles.cache.has(r.id) && r.id !== guild.id);
            if (addedRoles.size > 0 || removedRoles.size > 0) {
                await (0, logger_1.sendLog)(guild, logger_1.LOG.MEMBERS, (0, logger_1.logRoleChange)(after, addedRoles.map(r => r.toString()), removedRoles.map(r => r.toString())));
            }
        }
        // ── Apelido ───────────────────────────────────────────────────────
        if (before.nickname !== after.nickname) {
            await (0, logger_1.sendLog)(guild, logger_1.LOG.MEMBERS, (0, logger_1.logNicknameChange)(after, before.nickname ?? null, after.nickname ?? null));
        }
        // ── Timeout ───────────────────────────────────────────────────────
        const beforeTimeout = before.communicationDisabledUntil;
        const afterTimeout = after.communicationDisabledUntil;
        if (beforeTimeout?.getTime() !== afterTimeout?.getTime()) {
            await (0, logger_1.sendLog)(guild, logger_1.LOG.MEMBERS, (0, logger_1.logTimeout)(after, afterTimeout ?? null));
        }
    },
};
//# sourceMappingURL=guildMemberUpdate.js.map