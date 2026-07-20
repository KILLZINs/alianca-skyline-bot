"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client_1 = require("../../database/client");
const embeds_1 = require("../../utils/embeds");
const permissions_1 = require("../../utils/permissions");
const helpers_1 = require("../../utils/helpers");
exports.default = {
    category: 'rewards',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('recompensa')
        .setDescription('Sistema de moedas e recompensas')
        .addSubcommand(sub => sub.setName('dar').setDescription('Dá moedas para um membro (admin)')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro').setRequired(true))
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantidade de moedas').setRequired(true).setMinValue(1)))
        .addSubcommand(sub => sub.setName('remover').setDescription('Remove moedas de um membro (admin)')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro').setRequired(true))
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantidade de moedas').setRequired(true).setMinValue(1)))
        .addSubcommand(sub => sub.setName('ver').setDescription('Vê o saldo de moedas de um membro')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro (padrão: você)').setRequired(false))),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'dar') {
            if (!(await (0, permissions_1.checkAdmin)(interaction)))
                return;
            const target = interaction.options.getMember('usuario');
            const qtd = interaction.options.getInteger('quantidade', true);
            if (!target)
                return interaction.reply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Membro não encontrado.')], ephemeral: true });
            await interaction.deferReply({ ephemeral: true });
            const m = await (0, helpers_1.getOrCreateMember)(target.id, target.user.username);
            await client_1.prisma.member.update({ where: { discordId: target.id }, data: { coins: { increment: qtd } } });
            await interaction.editReply({ embeds: [(0, embeds_1.successEmbed)('Moedas Adicionadas!', `${target} recebeu 🪙 **${qtd}** moedas. Saldo atual: **${m.coins + qtd}**`)] });
        }
        else if (sub === 'remover') {
            if (!(await (0, permissions_1.checkAdmin)(interaction)))
                return;
            const target = interaction.options.getMember('usuario');
            const qtd = interaction.options.getInteger('quantidade', true);
            if (!target)
                return interaction.reply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Membro não encontrado.')], ephemeral: true });
            await interaction.deferReply({ ephemeral: true });
            const m = await (0, helpers_1.getOrCreateMember)(target.id, target.user.username);
            const newCoins = Math.max(0, m.coins - qtd);
            await client_1.prisma.member.update({ where: { discordId: target.id }, data: { coins: newCoins } });
            await interaction.editReply({ embeds: [(0, embeds_1.successEmbed)('Moedas Removidas!', `${target} perdeu 🪙 **${qtd - (m.coins - newCoins)}** moedas. Saldo atual: **${newCoins}**`)] });
        }
        else if (sub === 'ver') {
            const target = interaction.options.getMember('usuario') ?? interaction.member;
            const user = target.user;
            await interaction.deferReply();
            const m = await (0, helpers_1.getOrCreateMember)(user.id, user.username);
            const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD)
                .setTitle(`🪙 Moedas de ${user.username}`)
                .setThumbnail(user.displayAvatarURL())
                .setDescription(`💰 Saldo atual: **${m.coins} moedas**`)
                .setFooter({ text: '⚔️ Aliança Skyline' });
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
//# sourceMappingURL=recompensa.js.map