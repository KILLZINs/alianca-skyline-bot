"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
exports.default = {
    name: 'voiceStateUpdate',
    once: false,
    async execute(before, after) {
        const member = after.member ?? before.member;
        if (!member || member.user.bot)
            return;
        const guild = after.guild;
        if (!before.channel && after.channel) {
            // Entrou em um canal de voz
            await (0, logger_1.sendLog)(guild, logger_1.LOG.VOICE, (0, logger_1.logVoice)(member, 'join', undefined, after.channel.name));
        }
        else if (before.channel && !after.channel) {
            // Saiu de um canal de voz
            await (0, logger_1.sendLog)(guild, logger_1.LOG.VOICE, (0, logger_1.logVoice)(member, 'leave', before.channel.name));
        }
        else if (before.channel && after.channel && before.channel.id !== after.channel.id) {
            // Moveu de canal
            await (0, logger_1.sendLog)(guild, logger_1.LOG.VOICE, (0, logger_1.logVoice)(member, 'move', before.channel.name, after.channel.name));
        }
    },
};
//# sourceMappingURL=voiceStateUpdate.js.map