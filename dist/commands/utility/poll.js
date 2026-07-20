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
const client_1 = require("../../database/client");
const embeds_1 = require("../../utils/embeds");
const permissions_1 = require("../../utils/permissions");
exports.default = {
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('poll')
        .setDescription('Cria uma enquete interativa (admin)')
        .addSubcommand(sub => sub.setName('criar').setDescription('Cria uma nova poll')
        .addStringOption(opt => opt.setName('pergunta').setDescription('Pergunta da poll').setRequired(true).setMaxLength(200))
        .addStringOption(opt => opt.setName('opcao1').setDescription('Opção 1').setRequired(true).setMaxLength(80))
        .addStringOption(opt => opt.setName('opcao2').setDescription('Opção 2').setRequired(true).setMaxLength(80))
        .addStringOption(opt => opt.setName('opcao3').setDescription('Opção 3 (opcional)').setRequired(false).setMaxLength(80))
        .addStringOption(opt => opt.setName('opcao4').setDescription('Opção 4 (opcional)').setRequired(false).setMaxLength(80))),
    async execute(interaction) {
        if (!(await (0, permissions_1.checkAdmin)(interaction)))
            return;
        const { isFeatureEnabled, featureDisabledMsg } = await Promise.resolve().then(() => __importStar(require('../../utils/features')));
        if (interaction.guildId && !(await isFeatureEnabled(interaction.guildId, 'featPolls'))) {
            return interaction.reply({ content: featureDisabledMsg('featPolls'), ephemeral: true });
        }
        const sub = interaction.options.getSubcommand();
        if (sub !== 'criar')
            return;
        const pergunta = interaction.options.getString('pergunta', true);
        const opcoes = [
            interaction.options.getString('opcao1', true),
            interaction.options.getString('opcao2', true),
            interaction.options.getString('opcao3') ?? null,
            interaction.options.getString('opcao4') ?? null,
        ].filter((o) => !!o);
        await interaction.deferReply({ ephemeral: true });
        const channel = interaction.channel;
        const guild = interaction.guild;
        const poll = await client_1.prisma.poll.create({
            data: { guildId: guild.id, channelId: channel.id, question: pergunta, createdBy: interaction.user.id, options: { create: opcoes.map(label => ({ label, votes: 0 })) } },
            include: { options: true },
        });
        const emojis = ['🅰️', '🅱️', '🆑', '🆔'];
        const desc = poll.options.map((o, idx) => `${emojis[idx]} **${o.label}**\n\`░░░░░░░░░░\` 0%`).join('\n\n');
        const embed = (0, embeds_1.baseEmbed)().setTitle(`📊 ${pergunta}`).setDescription(desc).setFooter({ text: '0 votos • ⚔️ Aliança Skyline' });
        const row = new discord_js_1.ActionRowBuilder().addComponents(poll.options.map((o, idx) => new discord_js_1.ButtonBuilder().setCustomId(`poll:vote:${poll.id}:${idx}`).setLabel(o.label).setEmoji(emojis[idx]).setStyle(discord_js_1.ButtonStyle.Primary)));
        const msg = await channel.send({ embeds: [embed], components: [row] });
        await client_1.prisma.poll.update({ where: { id: poll.id }, data: { messageId: msg.id } });
        await interaction.editReply({ embeds: [(0, embeds_1.successEmbed)('Poll Criada!', `Poll publicada em ${channel}`)] });
    },
};
//# sourceMappingURL=poll.js.map