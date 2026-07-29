"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
const allowlist_1 = require("../utils/allowlist");
const embeds_2 = require("../utils/embeds");
exports.default = {
    category: 'alianca',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('alianca')
        .setDescription('Painel de administração da Aliança Skyline (apenas adm aliança)'),
    async execute(interaction) {
        if (!(0, allowlist_1.isBotManager)(interaction.user.id)) {
            return interaction.reply({
                embeds: [(0, embeds_2.errorEmbed)('Sem Permissão', 'Apenas administradores da Aliança Skyline podem usar este painel.')],
                ephemeral: true,
            });
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.PRIMARY)
            .setTitle('🌌 Aliança Skyline — Painel ADM')
            .setDescription('Gerencie a Aliança Skyline através dos painéis abaixo.\n\n' +
            '**Servidores:** Adicionar, remover e atualizar classes\n' +
            '**Pessoas:** Definir representantes e donos por servidor\n' +
            '**Embed Oficial:** Enviar ou atualizar o embed público da aliança\n' +
            '**Blacklist:** Banir usuário de todos os servidores da aliança')
            .addFields({ name: '🏛️ Servidores', value: 'Gerenciar servidores membros', inline: true }, { name: '👥 Representantes', value: 'Definir donos e representantes', inline: true }, { name: '📊 Análise', value: 'Ver detalhes de todos os servidores', inline: true }, { name: '📢 Embed Oficial', value: 'Enviar/atualizar embed da aliança', inline: true }, { name: '🚫 Blacklist', value: 'Banir usuário de todos os servidores', inline: true }, { name: '👁️ Ver Membros', value: 'Listar donos e representantes', inline: true })
            .setFooter({ text: '⚔️ Aliança Skyline — Admin' })
            .setTimestamp();
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('alianca:add_server').setLabel('Adicionar Servidor').setEmoji('➕').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('alianca:remove_server').setLabel('Remover Servidor').setEmoji('➖').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('alianca:update_classes').setLabel('Atualizar Classes').setEmoji('🔄').setStyle(discord_js_1.ButtonStyle.Secondary));
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('alianca:set_member').setLabel('Setar Rep/Dono').setEmoji('👤').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('alianca:remove_member').setLabel('Remover Rep/Dono').setEmoji('🗑️').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('alianca:view_members').setLabel('Ver Reps/Donos').setEmoji('👥').setStyle(discord_js_1.ButtonStyle.Secondary));
        const row3 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('alianca:analysis').setLabel('Análise').setEmoji('📊').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('alianca:send_embed').setLabel('Enviar Embed').setEmoji('📢').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('alianca:update_embed').setLabel('Atualizar Embed').setEmoji('🔁').setStyle(discord_js_1.ButtonStyle.Secondary));
        const row4 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('alianca:blacklist_add').setLabel('Blacklist Add').setEmoji('🚫').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('alianca:blacklist_remove').setLabel('Blacklist Remover').setEmoji('✅').setStyle(discord_js_1.ButtonStyle.Secondary));
        await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4], ephemeral: true });
    },
};
//# sourceMappingURL=alianca.js.map