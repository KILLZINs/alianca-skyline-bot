"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
exports.default = {
    name: 'guildBanRemove',
    once: false,
    async execute(ban) {
        // Buscar audit log para saber quem desbanou
        let moderator = ban.client.user;
        try {
            const logs = await ban.guild.fetchAuditLogs({ type: 23 /* MemberBanRemove */, limit: 1 });
            const entry = logs.entries.first();
            if (entry && entry.target?.id === ban.user.id && Date.now() - entry.createdTimestamp < 5000) {
                moderator = entry.executor ?? moderator;
            }
        }
        catch { /* audit log pode não estar disponível */ }
        const embed = (0, logger_1.logUnban)(ban.user, moderator, ban.reason ?? 'Sem motivo');
        await (0, logger_1.sendLog)(ban.guild, logger_1.LOG.MODERATION, embed);
    },
};
//# sourceMappingURL=guildBanRemove.js.map