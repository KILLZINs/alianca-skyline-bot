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
        .setDescription('Painel do servidor na Aliança Skyline (donos e cargos autorizados)'),
    async execute(interaction) {
        if (!interaction.guild || !interaction.member) {
            return interaction.reply({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'Use em um servidor.')], ephemeral: true });
        }
        const member = interaction.member;
        const guildId = interaction.guild.id;
        const isOwner = interaction.guild.ownerId === interaction.user.id;
        const isMgr = member.permissions.has('ManageGuild');
        // Fetch alliance server upfront — necessário para verificar panelRoleId
        const allianceServer = await client_1.prisma.allianceServer.findUnique({ where: { guildId } });
        const hasPanelRole = allianceServer?.panelRoleId
            ? member.roles.cache.has(allianceServer.panelRoleId)
            : false;
        if (!isOwner && !isMgr && !hasPanelRole) {
            return interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas donos, gerentes do servidor ou membros com o cargo de acesso podem usar este painel.')],
                ephemeral: true,
            });
        }
        if (!allianceServer) {
            return interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Servidor não cadastrado', 'Este servidor não está cadastrado na Aliança Skyline.\nPeça a um admin da aliança para adicioná-lo com `/alianca`.')],
                ephemeral: true,
            });
        }
        const cls = (0, alliance_1.getServerClass)(allianceServer.memberCount ?? interaction.guild.memberCount);
        const next = (0, alliance_1.getNextClass)(allianceServer.memberCount ?? interaction.guild.memberCount);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(cls.color)
            .setTitle(`${cls.emoji} ${interaction.guild.name} — Painel do Servidor`)
            .setThumbnail(interaction.guild.iconURL() ?? null)
            .addFields({ name: '🏷️ Classe Atual', value: `${cls.emoji} **${cls.name}**`, inline: true }, { name: '👥 Membros', value: `**${(allianceServer.memberCount ?? interaction.guild.memberCount).toLocaleString('pt-BR')}**`, inline: true }, { name: '📌 Canal Aliança', value: allianceServer.channelId ? `<#${allianceServer.channelId}>` : '*Não configurado*', inline: true }, { name: '🔗 Link de Convite', value: allianceServer.inviteLink ? `[Clique aqui](${allianceServer.inviteLink})` : '*Não configurado*', inline: true }, { name: '🔑 Cargo de Acesso', value: allianceServer.panelRoleId ? `<@&${allianceServer.panelRoleId}>` : '*Apenas dono / ManageGuild*', inline: true }, {
            name: next ? `📈 Próxima Classe: ${next.cls.emoji} ${next.cls.name}` : '🏆 Classe Máxima',
            value: next ? `Faltam **${next.needed.toLocaleString('pt-BR')}** membros` : 'Você está no topo da aliança!',
            inline: false,
        })
            .setFooter({ text: '⚔️ Aliança Skyline' })
            .setTimestamp();
        // Linha 1 — configurações do servidor na aliança
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('servidor:set_channel').setLabel('Canal Aliança').setEmoji('📌').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('servidor:set_invite').setLabel('Link Convite').setEmoji('🔗').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('servidor:set_panel_role').setLabel('Cargo Acesso').setEmoji('🔑').setStyle(discord_js_1.ButtonStyle.Secondary));
        // Linha 2 — visualizações (movidas do /painel)
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('servidor:stats_server').setLabel('Estatísticas').setEmoji('📊').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('servidor:rede').setLabel('Rede Aliança').setEmoji('🌐').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('servidor:performance').setLabel('Desempenho').setEmoji('📈').setStyle(discord_js_1.ButtonStyle.Secondary));
        await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    },
};
//# sourceMappingURL=servidor.js.map