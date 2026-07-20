"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const embeds_1 = require("../../utils/embeds");
const permissions_1 = require("../../utils/permissions");
const helpers_1 = require("../../utils/helpers");
exports.default = {
    category: 'events',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('evento')
        .setDescription('Gerencia eventos do servidor')
        .addSubcommand(sub => sub.setName('criar').setDescription('Cria um novo evento (admin)')
        .addStringOption(opt => opt.setName('titulo').setDescription('Título do evento').setRequired(true).setMaxLength(100))
        .addStringOption(opt => opt.setName('descricao').setDescription('Descrição do evento').setRequired(true).setMaxLength(1000))
        .addStringOption(opt => opt.setName('quando').setDescription('Quando acontece: 1h, 2d, 30m').setRequired(true)))
        .addSubcommand(sub => sub.setName('encerrar').setDescription('Encerra um evento (admin)')
        .addStringOption(opt => opt.setName('id').setDescription('ID do evento').setRequired(true))),
    async execute(interaction) {
        if (!(await (0, permissions_1.checkAdmin)(interaction)))
            return;
        const sub = interaction.options.getSubcommand();
        const guild = interaction.guild;
        if (sub === 'criar') {
            const titulo = interaction.options.getString('titulo', true);
            const descricao = interaction.options.getString('descricao', true);
            const quandoStr = interaction.options.getString('quando', true);
            const ms = (0, helpers_1.parseDuration)(quandoStr);
            if (!ms)
                return interaction.reply({ embeds: [(0, embeds_1.errorEmbed)('Duração inválida', 'Use: `1h`, `2d`, `30m`')], ephemeral: true });
            const startsAt = new Date(Date.now() + ms);
            await interaction.deferReply({ ephemeral: true });
            const channel = interaction.channel;
            const event = await client_1.prisma.event.create({ data: { guildId: guild.id, channelId: channel.id, title: titulo, description: descricao, hostId: interaction.user.id, startsAt } });
            const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.SECONDARY)
                .setTitle(`${embeds_1.EMOJIS.BELL} ${titulo}`)
                .setDescription(descricao)
                .addFields({ name: '📅 Quando', value: `<t:${Math.floor(startsAt.getTime() / 1000)}:F>\n(<t:${Math.floor(startsAt.getTime() / 1000)}:R>)`, inline: true }, { name: '👑 Organizador', value: `${interaction.user}`, inline: true }, { name: '👥 Inscritos', value: '**0**', inline: true })
                .setFooter({ text: `ID: ${event.id} • ⚔️ Aliança Skyline` });
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`event:join:${event.id}`).setLabel('Participar').setEmoji('✅').setStyle(discord_js_1.ButtonStyle.Success));
            const msg = await channel.send({ embeds: [embed], components: [row] });
            await client_1.prisma.event.update({ where: { id: event.id }, data: { messageId: msg.id } });
            await interaction.editReply({ embeds: [(0, embeds_1.successEmbed)('Evento Criado!', `Evento publicado em ${channel}`)] });
        }
        else if (sub === 'encerrar') {
            const id = interaction.options.getString('id', true);
            await interaction.deferReply({ ephemeral: true });
            const event = await client_1.prisma.event.findUnique({ where: { id }, include: { _count: { select: { participants: true } } } });
            if (!event || event.guildId !== guild.id)
                return interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Evento não encontrado.')] });
            if (event.ended)
                return interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('Já encerrado', 'Este evento já foi encerrado.')] });
            await client_1.prisma.event.update({ where: { id }, data: { ended: true } });
            const channel = guild.channels.cache.get(event.channelId);
            if (channel && event.messageId) {
                const msg = await channel.messages.fetch(event.messageId).catch(() => null);
                if (msg) {
                    await msg.edit({ components: [], embeds: [(0, embeds_1.baseEmbed)(embeds_1.COLORS.ERROR).setTitle(`🎉 ${event.title} — Encerrado`).setDescription(event.description ?? '').addFields({ name: '👥 Total de inscritos', value: `${event._count.participants}` }).setFooter({ text: '⚔️ Aliança Skyline' })] }).catch(() => null);
                }
            }
            await interaction.editReply({ embeds: [(0, embeds_1.successEmbed)('Evento Encerrado!', `Evento **${event.title}** encerrado. ${event._count.participants} participante(s).`)] });
        }
    },
};
//# sourceMappingURL=evento.js.map