"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../../utils/embeds");
const permissions_1 = require("../../utils/permissions");
exports.default = {
    category: 'tickets',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Gerencia o sistema de tickets')
        .addSubcommand(sub => sub.setName('painel').setDescription('Envia o painel de criação de tickets neste canal')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal para enviar o painel (padrão: atual)').setRequired(false))),
    async execute(interaction) {
        if (!(await (0, permissions_1.checkAdmin)(interaction)))
            return;
        const { isFeatureEnabled, featureDisabledMsg } = await Promise.resolve().then(() => __importStar(require('../../utils/features')));
        if (interaction.guildId && !(await isFeatureEnabled(interaction.guildId, 'featTickets'))) {
            return interaction.reply({ content: featureDisabledMsg('featTickets'), ephemeral: true });
        }
        const sub = interaction.options.getSubcommand();
        if (sub === 'painel') {
            const target = (interaction.options.getChannel('canal') ?? interaction.channel);
            const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.PRIMARY)
                .setTitle(`${embeds_1.EMOJIS.TICKET} Sistema de Tickets — Aliança Skyline`)
                .setDescription('**Precisa de ajuda ou quer falar com a equipe?**\n\n' +
                'Clique no botão abaixo para abrir um ticket. Um membro da equipe irá atendê-lo em breve.\n\n' +
                '📋 Tenha em mãos as informações necessárias para agilizar o atendimento.')
                .addFields({ name: '🛠️ Suporte Geral', value: 'Dúvidas e problemas gerais', inline: true }, { name: '🤝 Parceria', value: 'Pedidos de parceria', inline: true }, { name: '🚨 Reporte', value: 'Reportar usuários ou bugs', inline: true }, { name: '📋 Candidatura', value: 'Candidatura para staff', inline: true }, { name: '❓ Outro', value: 'Outros assuntos', inline: true })
                .setFooter({ text: '⚔️ Aliança Skyline • Abra apenas um ticket por vez' });
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('painel:ticket').setLabel('Abrir Ticket').setEmoji('🎫').setStyle(discord_js_1.ButtonStyle.Primary));
            await target.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Painel de tickets enviado em ${target}!`, ephemeral: true });
        }
    },
};
//# sourceMappingURL=ticket.js.map