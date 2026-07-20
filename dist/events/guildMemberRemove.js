"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../database/client");
const logger_1 = require("../utils/logger");
function today() { return new Date().toISOString().slice(0, 10); }
exports.default = {
    name: 'guildMemberRemove',
    once: false,
    async execute(member) {
        const guildId = member.guild.id;
        const date = today();
        await client_1.prisma.serverStat.upsert({
            where: { guildId_date: { guildId, date } },
            update: { leaves: { increment: 1 } },
            create: { guildId, date, leaves: 1 },
        }).catch(console.error);
        // Log de saída (só funciona se o membro estiver em cache com cargos)
        if (member instanceof Object && 'roles' in member && member.roles) {
            await (0, logger_1.sendLog)(member.guild, logger_1.LOG.MEMBERS, (0, logger_1.logMemberLeave)(member)).catch(() => null);
        }
    },
};
//# sourceMappingURL=guildMemberRemove.js.map