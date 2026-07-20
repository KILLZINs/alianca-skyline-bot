"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
exports.default = {
    category: 'feedback',
    data: new discord_js_1.SlashCommandBuilder().setName('sugestao').setDescription('Envie uma sugestão para melhorar o servidor'),
    async execute(interaction) {
        const modal = new discord_js_1.ModalBuilder().setCustomId('modal:sugestaosubmit').setTitle('💡 Nova Sugestão');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('titulo').setLabel('Título da Sugestão').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setMaxLength(100)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('descricao').setLabel('Descreva sua sugestão').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setPlaceholder('Explique sua ideia com detalhes...')));
        await interaction.showModal(modal);
    },
};
//# sourceMappingURL=sugestao.js.map