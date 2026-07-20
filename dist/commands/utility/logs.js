"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const logsHandler_1 = require("../../handlers/logsHandler");
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('logs')
        .setDescription('⚙️ Configura o canal e categorias de log do servidor')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const { embed, rows } = await (0, logsHandler_1.buildLogsPanel)(interaction.guild);
        await interaction.editReply({ embeds: [embed], components: rows });
    },
};
//# sourceMappingURL=logs.js.map