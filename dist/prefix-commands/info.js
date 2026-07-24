"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
exports.default = {
    name: 'info',
    description: 'Informações sobre o bot',
    async execute(message, _args) {
        const client = message.client;
        const uptimeMin = Math.floor((client.uptime ?? 0) / 60000);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.PRIMARY ?? 0x5865F2)
            .setTitle('🤖 Aliança Skyline Bot')
            .setDescription('Bot oficial da **Aliança Skyline** — unindo servidores para crescerem juntos.')
            .setThumbnail(client.user?.displayAvatarURL() ?? null)
            .addFields({ name: '📡 Servidores', value: `${client.guilds.cache.size}`, inline: true }, { name: '👥 Usuários', value: `${client.users.cache.size}`, inline: true }, { name: '⏱️ Uptime', value: `${uptimeMin} min`, inline: true }, { name: '📌 Prefix', value: '`b `', inline: true }, { name: '🧠 Bryan (I.A.)', value: 'Mencione `Bryan` na mensagem', inline: true })
            .setFooter({ text: '⚔️ Aliança Skyline • v2.0' })
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    },
};
//# sourceMappingURL=info.js.map