"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../../utils/embeds");
const botConfig_1 = require("../../utils/botConfig");
const client_1 = require("../../database/client");
exports.default = {
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('afk')
        .setDescription('Define seu status de AFK')
        .addStringOption(option => option
        .setName('motivo')
        .setDescription('Motivo do AFK (opcional)')
        .setRequired(false)
        .setMaxLength(200)),
    async execute(interaction) {
        if (!(0, botConfig_1.getBotConfig)().featAfk) {
            return interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Desativado', 'O sistema AFK está desativado no momento.')],
                ephemeral: true,
            });
        }
        const motivo = interaction.options.getString('motivo') ?? 'Ausente';
        const userId = interaction.user.id;
        const existing = await client_1.prisma.afkStatus.findUnique({ where: { userId } });
        if (existing) {
            return interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Já em AFK', `Você já está em AFK com o motivo: **${existing.message}**\nEnvie qualquer mensagem para sair do AFK automaticamente.`)],
                ephemeral: true,
            });
        }
        await client_1.prisma.afkStatus.create({
            data: { userId, message: motivo },
        });
        await interaction.reply({
            embeds: [
                (0, embeds_1.successEmbed)('AFK Ativado', `Você entrou em modo AFK.\n**Motivo:** ${motivo}\n\nVocê será retirado do AFK automaticamente ao enviar uma mensagem.`),
            ],
            ephemeral: true,
        });
    },
};
//# sourceMappingURL=afk.js.map