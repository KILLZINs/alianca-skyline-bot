"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../database/client");
function today() { return new Date().toISOString().slice(0, 10); }
exports.default = {
    name: 'guildBanAdd',
    once: false,
    async execute(ban) {
        const guildId = ban.guild.id;
        const date = today();
        await client_1.prisma.serverStat.upsert({
            where: { guildId_date: { guildId, date } },
            update: { bans: { increment: 1 } },
            create: { guildId, date, bans: 1 },
        }).catch(console.error);
    },
};
//# sourceMappingURL=guildBanAdd.js.map