"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const permissions_1 = require("../../utils/permissions");
exports.default = {
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder().setName('anuncio').setDescription('Envia um anúncio no canal configurado (admin)'),
    async execute(interaction) {
        if (!(await (0, permissions_1.checkAdmin)(interaction)))
            return;
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:anuncio').setTitle('📢 Novo Anúncio');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('titulo').setLabel('Título').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(100)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('mensagem').setLabel('Conteúdo do Anúncio').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true).setMaxLength(2000)));
        await interaction.showModal(modal);
    },
};
//# sourceMappingURL=anuncio.js.map