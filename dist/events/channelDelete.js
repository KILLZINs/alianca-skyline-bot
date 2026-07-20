"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const logger_1 = require("../utils/logger");
function channelTypeName(type) {
    const map = {
        [discord_js_1.ChannelType.GuildText]: 'Texto',
        [discord_js_1.ChannelType.GuildVoice]: 'Voz',
        [discord_js_1.ChannelType.GuildCategory]: 'Categoria',
        [discord_js_1.ChannelType.GuildAnnouncement]: 'Anúncio',
        [discord_js_1.ChannelType.GuildForum]: 'Fórum',
        [discord_js_1.ChannelType.GuildStageVoice]: 'Palco',
        [discord_js_1.ChannelType.PublicThread]: 'Thread Pública',
        [discord_js_1.ChannelType.PrivateThread]: 'Thread Privada',
    };
    return map[type] ?? 'Desconhecido';
}
exports.default = {
    name: 'channelDelete',
    once: false,
    async execute(channel) {
        if (!channel.guild)
            return;
        await (0, logger_1.sendLog)(channel.guild, logger_1.LOG.CHANNELS, (0, logger_1.logChannelDelete)(channel.name, channelTypeName(channel.type)));
    },
};
//# sourceMappingURL=channelDelete.js.map