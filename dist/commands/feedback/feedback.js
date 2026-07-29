"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
exports.default = {
    category: 'feedback',
    data: new discord_js_1.SlashCommandBuilder().setName('feedback').setDescription('Envia um feedback para a equipe da aliança'),
    async execute(interaction) {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:feedbacksubmit').setTitle('💬 Enviar Feedback');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('assunto').setLabel('Assunto').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(100)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('mensagem').setLabel('Sua mensagem').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setPlaceholder('Descreva seu feedback com detalhes...')));
        await interaction.showModal(modal);
    },
};
//# sourceMappingURL=feedback.js.map