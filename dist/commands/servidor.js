"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
const client_1 = require("../database/client");
const alliance_1 = require("../utils/alliance");
exports.default = {
    category: 'alianca',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('servidor')
        .setDescription('Painel do servidor na Aliança Skyline (donos do servidor)'),
    async execute(interaction) {
        if (!interaction.guild || !interaction.member) {
            return interaction.reply({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'Use em um servidor.')], ephemeral: true });
        }
        const member = interaction.member;
        const isOwner = interaction.guild.ownerId === interaction.user.id;
        const isManager = member.permissions.has('ManageGuild');
        if (!isOwner && !isManager) {
            return interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas donos ou gerentes do servidor podem usar este painel.')],
                ephemeral: true,
            });
        }
        const guildId = interaction.guild.id;
        const inAlliance = await (0, alliance_1.isAllianceServer)(guildId);
        if (!inAlliance) {
            return interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Servidor não cadastrado', 'Este servidor não está cadastrado na Aliança Skyline.\nPeça a um admin da aliança para adicioná-lo com `/alianca`.')],
                ephemeral: true,
            });
        }
        const allianceServer = await client_1.prisma.allianceServer.findUnique({ where: { guildId } });
        const cls = (0, alliance_1.getServerClass)(allianceServer?.memberCount ?? interaction.guild.memberCount);
        const next = (0, alliance_1.getNextClass)(allianceServer?.memberCount ?? interaction.guild.memberCount);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(cls.color)
            .setTitle(`${cls.emoji} ${interaction.guild.name} — Painel do Servidor`)
            .setThumbnail(interaction.guild.iconURL() ?? null)
            .addFields({ name: '🏷️ Classe Atual', value: `${cls.emoji} **${cls.name}**`, inline: true }, { name: '👥 Membros', value: `**${(allianceServer?.memberCount ?? interaction.guild.memberCount).toLocaleString('pt-BR')}**`, inline: true }, { name: '📌 Canal Aliança', value: allianceServer?.channelId ? `<#${allianceServer.channelId}>` : '*Não configurado*', inline: true }, { name: '🔗 Link de Convite', value: allianceServer?.inviteLink ? `[Clique aqui](${allianceServer.inviteLink})` : '*Não configurado*', inline: true }, {
            name: next ? `📈 Próxima Classe: ${next.cls.emoji} ${next.cls.name}` : '🏆 Classe Máxima',
            value: next ? `Faltam **${next.needed.toLocaleString('pt-BR')}** membros` : 'Você está no topo da aliança!',
            inline: false,
        })
            .setFooter({ text: '⚔️ Aliança Skyline' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('servidor:set_channel').setLabel('Definir Canal Aliança').setEmoji('📌').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('servidor:set_invite').setLabel('Definir Link Convite').setEmoji('🔗').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('servidor:performance').setLabel('Desempenho').setEmoji('📊').setStyle(discord_js_1.ButtonStyle.Secondary));
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
//# sourceMappingURL=servidor.js.map