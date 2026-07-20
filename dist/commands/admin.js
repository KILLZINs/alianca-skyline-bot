"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
const permissions_1 = require("../utils/permissions");
const allowlist_1 = require("../utils/allowlist");
exports.default = {
    category: 'admin',
    data: new discord_js_1.SlashCommandBuilder().setName('admin').setDescription('Painel de administração da Aliança Skyline'),
    async execute(interaction) {
        if (!(await (0, permissions_1.checkAdmin)(interaction)))
            return;
        const showAllowlist = (0, allowlist_1.isBotManager)(interaction.user.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.DARK)
            .setTitle(`${embeds_1.EMOJIS.CROWN} Painel de Administração`)
            .setDescription('Gerencie o servidor através dos painéis abaixo.')
            .addFields({ name: '⚙️ Configurações', value: 'Canais, cargos, XP, boas-vindas', inline: true }, { name: '📢 Comunicação', value: 'Anúncios, enquetes, eventos', inline: true }, { name: '🎁 Entretenimento', value: 'Sorteios, conquistas, recompensas', inline: true }, { name: '🪙 Economia', value: 'Dar/remover moedas e XP', inline: true }, { name: '🛍️ Loja', value: 'Gerenciar itens da loja', inline: true }, { name: '🎯 Recompensas de Nível', value: 'Cargos automáticos por nível', inline: true }, { name: '📈 Estatísticas', value: 'Stats detalhados do servidor', inline: true }, { name: '🔨 Moderação', value: 'Ações de moderação rápida', inline: true }, { name: '🎭 Registro de Cargos', value: 'Menus de auto-cargo para membros', inline: true }, { name: '🔧 Módulos', value: 'Habilitar/desabilitar features', inline: true }, ...(showAllowlist ? [{ name: '🌐 Acesso (Allowlist)', value: 'Servidores e managers autorizados', inline: true }] : []))
            .setTimestamp()
            .setFooter({ text: '⚔️ Aliança Skyline — Admin' });
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('admin:config').setLabel('Configurações').setEmoji('⚙️').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('admin:anuncio').setLabel('Anúncio').setEmoji('📢').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('admin:poll').setLabel('Poll').setEmoji('📊').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('admin:evento').setLabel('Evento').setEmoji('📌').setStyle(discord_js_1.ButtonStyle.Primary));
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('admin:sorteio').setLabel('Sorteio').setEmoji('🎁').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('admin:encerrar_sorteio').setLabel('Encerrar Sorteio').setEmoji('🏆').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('admin:conquista').setLabel('Conquistas').setEmoji('🏅').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('admin:nivel_reward').setLabel('Recomp. Nível').setEmoji('🎯').setStyle(discord_js_1.ButtonStyle.Secondary));
        const row3 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('admin:economia').setLabel('Economia').setEmoji('🪙').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('admin:loja').setLabel('Loja').setEmoji('🛍️').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('admin:rank').setLabel('Definir Rank').setEmoji('👑').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('admin:cargo_menu').setLabel('Registro de Cargos').setEmoji('🎭').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('admin:stats').setLabel('Estatísticas').setEmoji('📈').setStyle(discord_js_1.ButtonStyle.Secondary));
        const row4 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('admin:modulos').setLabel('Módulos').setEmoji('🔧').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('admin:mod').setLabel('Moderação').setEmoji('🔨').setStyle(discord_js_1.ButtonStyle.Secondary));
        const components = [row1, row2, row3, row4];
        if (showAllowlist) {
            const row4 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('admin:allowlist').setLabel('Acesso (Allowlist)').setEmoji('🌐').setStyle(discord_js_1.ButtonStyle.Danger));
            components.push(row4);
        }
        await interaction.reply({ embeds: [embed], components, ephemeral: true });
    },
};
//# sourceMappingURL=admin.js.map