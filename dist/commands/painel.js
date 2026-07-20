"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
exports.default = {
    category: 'geral',
    data: new discord_js_1.SlashCommandBuilder().setName('painel').setDescription('Painel principal da Aliança Skyline'),
    async execute(interaction) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.PRIMARY)
            .setTitle('⚔️ Aliança Skyline — Painel Principal')
            .setDescription('Bem-vindo ao painel central! Selecione uma opção abaixo.')
            .setThumbnail(interaction.guild?.iconURL() ?? null)
            .addFields({ name: `${embeds_1.EMOJIS.PERSON} Perfil`, value: 'Perfil completo, XP, moedas', inline: true }, { name: `${embeds_1.EMOJIS.LEVEL} Nível`, value: 'Progresso e próxima recompensa', inline: true }, { name: `${embeds_1.EMOJIS.TROPHY} Ranking`, value: 'Top XP e top ricos', inline: true }, { name: `${embeds_1.EMOJIS.TROPHY} Conquistas`, value: 'Suas conquistas desbloqueadas', inline: true }, { name: `${embeds_1.EMOJIS.COINS} Economia`, value: 'Saldo e transferências', inline: true }, { name: `⭐ Loja`, value: 'Comprar itens com moedas', inline: true }, { name: `${embeds_1.EMOJIS.FIRE} Missões`, value: 'Missões diárias + resgatar', inline: true }, { name: `${embeds_1.EMOJIS.CHART} Servidor`, value: 'Stats do servidor de hoje', inline: true }, { name: `🌐 Rede`, value: 'Stats de toda a aliança', inline: true }, { name: `${embeds_1.EMOJIS.TICKET} Suporte`, value: 'Ticket, sugestão, feedback', inline: true }, { name: `${embeds_1.EMOJIS.GIFT} Sorteios`, value: 'Sorteios ativos', inline: true }, { name: `${embeds_1.EMOJIS.PIN} Eventos`, value: 'Eventos ativos', inline: true })
            .setTimestamp()
            .setFooter({ text: '⚔️ Aliança Skyline • /genero para personalizar pronomes • /rp para roleplay' });
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('painel:perfil').setLabel('Perfil').setEmoji('👤').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('painel:nivel').setLabel('Nível').setEmoji('🎯').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('painel:ranking').setLabel('Ranking').setEmoji('🏆').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('painel:conquistas').setLabel('Conquistas').setEmoji('🏅').setStyle(discord_js_1.ButtonStyle.Secondary));
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('painel:economia').setLabel('Economia').setEmoji('🪙').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('painel:loja').setLabel('Loja').setEmoji('🛍️').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('painel:missoes').setLabel('Missões').setEmoji('🔥').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('painel:servidor').setLabel('Servidor').setEmoji('📊').setStyle(discord_js_1.ButtonStyle.Primary));
        const row3 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('painel:rede').setLabel('Rede').setEmoji('🌐').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('painel:ticket').setLabel('Suporte').setEmoji('🎫').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('painel:sorteios').setLabel('Sorteios').setEmoji('🎁').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('painel:eventos').setLabel('Eventos').setEmoji('📌').setStyle(discord_js_1.ButtonStyle.Success));
        const row4 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('RPG').setEmoji('⚔️').setStyle(discord_js_1.ButtonStyle.Danger));
        await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4] });
    },
};
//# sourceMappingURL=painel.js.map