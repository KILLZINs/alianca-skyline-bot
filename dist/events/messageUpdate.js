"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
exports.default = {
    name: 'messageUpdate',
    once: false,
    async execute(before, after) {
        if (!after.guild)
            return;
        if (after.author?.bot)
            return;
        if (!after.author)
            return;
        const contentBefore = before.content ?? '';
        const contentAfter = after.content ?? '';
        // Ignorar edições sem mudança real no texto (ex: embed carregou)
        if (contentBefore === contentAfter)
            return;
        const embed = (0, logger_1.logMessageEdit)(after.author, contentBefore, contentAfter, after.channelId, after.url);
        await (0, logger_1.sendLog)(after.guild, logger_1.LOG.MESSAGES, embed);
    },
};
//# sourceMappingURL=messageUpdate.js.map