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
const helpers_1 = require("../../utils/helpers");
exports.default = {
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Gerencia sorteios do servidor')
        .addSubcommand(sub => sub.setName('criar').setDescription('Cria um novo sorteio (admin)')
        .addStringOption(opt => opt.setName('premio').setDescription('Prêmio do sorteio').setRequired(true))
        .addIntegerOption(opt => opt.setName('vencedores').setDescription('Número de vencedores').setRequired(true).setMinValue(1).setMaxValue(20))
        .addStringOption(opt => opt.setName('duracao').setDescription('Duração: 1h, 2d, 30m').setRequired(true)))
        .addSubcommand(sub => sub.setName('encerrar').setDescription('Encerra um sorteio antecipadamente (admin)')
        .addStringOption(opt => opt.setName('id').setDescription('ID do sorteio').setRequired(true))),
    async execute(interaction) {
        if (!(await (0, permissions_1.checkAdmin)(interaction)))
            return;
        const { isFeatureEnabled, featureDisabledMsg } = await Promise.resolve().then(() => __importStar(require('../../utils/features')));
        if (interaction.guildId && !(await isFeatureEnabled(interaction.guildId, 'featGiveaways'))) {
            return interaction.reply({ content: featureDisabledMsg('featGiveaways'), ephemeral: true });
        }
        const sub = interaction.options.getSubcommand();
        const guild = interaction.guild;
        if (sub === 'criar') {
            const premio = interaction.options.getString('premio', true);
            const vencedores = interaction.options.getInteger('vencedores', true);
            const duracaoStr = interaction.options.getString('duracao', true);
            const ms = (0, helpers_1.parseDuration)(duracaoStr);
            if (!ms)
                return interaction.reply({ embeds: [(0, embeds_1.errorEmbed)('Duração inválida', 'Use: `1h`, `2d`, `30m`')], ephemeral: true });
            const endsAt = new Date(Date.now() + ms);
            await interaction.deferReply({ ephemeral: true });
            const channel = interaction.channel;
            const giveaway = await client_1.prisma.giveaway.create({ data: { guildId: guild.id, channelId: channel.id, prize: premio, winners: vencedores, hostId: interaction.user.id, endsAt } });
            const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD)
                .setTitle(`🎁 Sorteio — ${premio}`)
                .addFields({ name: '🏆 Vencedores', value: `**${vencedores}**`, inline: true }, { name: '⏰ Encerra', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true }, { name: '👑 Criado por', value: `${interaction.user}`, inline: true })
                .setFooter({ text: '0 participantes • ⚔️ Aliança Skyline' });
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`giveaway:join:${giveaway.id}`).setLabel('Participar').setEmoji('🎁').setStyle(discord_js_1.ButtonStyle.Success));
            const msg = await channel.send({ embeds: [embed], components: [row] });
            await client_1.prisma.giveaway.update({ where: { id: giveaway.id }, data: { messageId: msg.id } });
            await interaction.editReply({ embeds: [(0, embeds_1.successEmbed)('Sorteio Criado!', `Sorteio publicado em ${channel}`)] });
        }
        else if (sub === 'encerrar') {
            const id = interaction.options.getString('id', true);
            await interaction.deferReply({ ephemeral: true });
            const giveaway = await client_1.prisma.giveaway.findUnique({ where: { id }, include: { entries: { include: { member: true } } } });
            if (!giveaway || giveaway.guildId !== guild.id)
                return interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Sorteio não encontrado.')] });
            if (giveaway.ended)
                return interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('Já encerrado', 'Este sorteio já foi encerrado.')] });
            const entries = giveaway.entries;
            const shuffled = entries.sort(() => Math.random() - 0.5);
            const chosen = shuffled.slice(0, giveaway.winners);
            const winnerMentions = chosen.map(e => `<@${e.member.discordId}>`).join(', ') || 'Nenhum participante.';
            await client_1.prisma.giveaway.update({ where: { id }, data: { ended: true } });
            const channel = guild.channels.cache.get(giveaway.channelId);
            if (channel) {
                await channel.send({ embeds: [(0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD).setTitle('🎉 Sorteio Encerrado!').setDescription(`**Prêmio:** ${giveaway.prize}\n**Vencedor(es):** ${winnerMentions}`).setFooter({ text: '⚔️ Aliança Skyline' })] });
                if (giveaway.messageId) {
                    const msg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
                    if (msg)
                        await msg.edit({ components: [] }).catch(() => null);
                }
            }
            await interaction.editReply({ embeds: [(0, embeds_1.successEmbed)('Encerrado!', `Vencedor(es): ${winnerMentions}`)] });
        }
    },
};
//# sourceMappingURL=giveaway.js.map