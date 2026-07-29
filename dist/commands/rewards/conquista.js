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
        .setName('conquista')
        .setDescription('Sistema de conquistas')
        .addSubcommand(sub => sub.setName('criar').setDescription('Cria uma nova conquista (admin)')
        .addStringOption(opt => opt.setName('nome').setDescription('Nome da conquista').setRequired(true).setMaxLength(60))
        .addStringOption(opt => opt.setName('descricao').setDescription('Descrição').setRequired(true).setMaxLength(200))
        .addIntegerOption(opt => opt.setName('xp').setDescription('XP de recompensa').setRequired(true).setMinValue(0))
        .addIntegerOption(opt => opt.setName('moedas').setDescription('Moedas de recompensa').setRequired(false).setMinValue(0)))
        .addSubcommand(sub => sub.setName('dar').setDescription('Concede uma conquista a um membro (admin)')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro').setRequired(true))
        .addStringOption(opt => opt.setName('nome').setDescription('Nome da conquista').setRequired(true)))
        .addSubcommand(sub => sub.setName('ver').setDescription('Vê as conquistas de um membro')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro (padrão: você)').setRequired(false))),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'criar') {
            if (!(await (0, permissions_1.checkAdmin)(interaction)))
                return;
            const nome = interaction.options.getString('nome', true);
            const descricao = interaction.options.getString('descricao', true);
            const xp = interaction.options.getInteger('xp', true);
            const moedas = interaction.options.getInteger('moedas') ?? 0;
            await interaction.deferReply({ ephemeral: true });
            const exists = await client_1.prisma.achievementTemplate.findFirst({ where: { name: nome, guildId: interaction.guild.id } });
            if (exists)
                return interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('Já existe', `Conquista **${nome}** já existe.`)] });
            await client_1.prisma.achievementTemplate.create({ data: { guildId: interaction.guild.id, name: nome, description: descricao, xpReward: xp, coinsReward: moedas } });
            await interaction.editReply({ embeds: [(0, embeds_1.successEmbed)('Conquista Criada!', `**${nome}** foi criada com ${xp} XP e ${moedas} moedas de recompensa.`)] });
        }
        else if (sub === 'dar') {
            if (!(await (0, permissions_1.checkAdmin)(interaction)))
                return;
            const target = interaction.options.getMember('usuario');
            const nome = interaction.options.getString('nome', true);
            if (!target)
                return interaction.reply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrado', 'Membro não encontrado.')], ephemeral: true });
            await interaction.deferReply({ ephemeral: true });
            const template = await client_1.prisma.achievementTemplate.findFirst({ where: { name: nome, guildId: interaction.guild.id } });
            if (!template)
                return interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('Não encontrada', `Conquista **${nome}** não existe. Crie primeiro com \`/conquista criar\`.`)] });
            const m = await (0, helpers_1.getOrCreateMember)(target.id, target.user.username);
            const alreadyHas = await client_1.prisma.achievement.findFirst({ where: { memberId: m.discordId, name: nome } });
            if (alreadyHas)
                return interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)('Já possui', `${target} já tem a conquista **${nome}**.`)] });
            await client_1.prisma.achievement.create({ data: { memberId: m.discordId, name: nome, description: template.description } });
            await client_1.prisma.member.update({ where: { discordId: m.discordId }, data: { xp: { increment: template.xpReward }, coins: { increment: template.coinsReward } } });
            await interaction.editReply({ embeds: [(0, embeds_1.successEmbed)('Conquista Concedida!', `${target} recebeu a conquista 🏆 **${nome}** (+${template.xpReward} XP, +${template.coinsReward} moedas)`)] });
        }
        else if (sub === 'ver') {
            const target = interaction.options.getMember('usuario') ?? interaction.member;
            const user = target.user;
            await interaction.deferReply();
            const achievements = await client_1.prisma.achievement.findMany({ where: { memberId: user.id }, orderBy: { earnedAt: 'desc' } });
            if (!achievements.length)
                return interaction.editReply({ embeds: [(0, embeds_1.baseEmbed)().setTitle(`${embeds_1.EMOJIS.TROPHY} Conquistas de ${user.username}`).setDescription('Nenhuma conquista ainda.')] });
            const list = achievements.map(a => `🏆 **${a.name}** — ${a.description ?? ''}\n<t:${Math.floor(a.earnedAt.getTime() / 1000)}:D>`).join('\n\n');
            await interaction.editReply({ embeds: [(0, embeds_1.baseEmbed)(embeds_1.COLORS.GOLD).setTitle(`${embeds_1.EMOJIS.TROPHY} Conquistas de ${user.username}`).setDescription(list).setThumbnail(user.displayAvatarURL()).setFooter({ text: `${achievements.length} conquista(s) • ⚔️ Aliança Skyline` })] });
        }
    },
};
//# sourceMappingURL=conquista.js.map