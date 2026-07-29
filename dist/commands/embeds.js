"use strict";
// ═══════════════════════════════════════════════════════════════════════
// COMANDO /embeds — painel de customização total de embeds
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const allowlist_1 = require("../utils/allowlist");
const embeds_1 = require("../utils/embeds");
const embedsHandler_1 = require("../handlers/embedsHandler");
exports.default = {
    category: 'admin',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('embeds')
        .setDescription('Customização total dos embeds do bot (cor, título, imagens, rodapé, descrição)'),
    async execute(interaction) {
        if (!await (0, allowlist_1.isBotManager)(interaction.user.id)) {
            return interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Sem permissão', 'Apenas gerenciadores do bot podem usar este comando.')],
                ephemeral: true,
            });
        }
        const { embed, rows } = (0, embedsHandler_1.buildEmbedsHome)();
        return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    },
};
//# sourceMappingURL=embeds.js.map