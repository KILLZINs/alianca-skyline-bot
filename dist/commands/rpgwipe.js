"use strict";
// ═══════════════════════════════════════════════════════════════════════
// COMANDO /rpgwipe — Wipe total de todos os dados de RPG
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const permissions_1 = require("../utils/permissions");
const client_1 = require("../database/client");
const embeds_1 = require("../utils/embeds");
exports.default = {
    category: 'admin',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('rpgwipe')
        .setDescription('[OWNER] Apaga TODOS os dados de RPG de todos os jogadores. Irreversível.'),
    async execute(interaction) {
        if (!(0, permissions_1.isOwner)(interaction.user.id)) {
            await interaction.reply({
                embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Apenas o dono do bot pode usar este comando.')],
                ephemeral: true,
            });
            return;
        }
        const [charCount, guildCount] = await Promise.all([
            client_1.prisma.rpgCharacter.count(),
            client_1.prisma.rpgGuild.count(),
        ]);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('☢️ RPG WIPE — Confirmação Necessária')
            .setDescription(`Você está prestes a **apagar permanentemente** todos os dados de RPG do servidor.\n\n` +
            `> 🧑 **${charCount}** personagem(ns) serão deletados\n` +
            `> 🏛️ **${guildCount}** guilda(s) serão deletadas\n` +
            `> Inventários, equipamentos, habilidades, logs de combate e filas de craft também serão removidos.\n\n` +
            `⚠️ **Esta ação é irreversível.** Tem certeza absoluta?`)
            .setFooter({ text: '⏱️ Expira em 30 segundos — reaja rápido' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('rpgwipe:confirm')
            .setLabel('☢️ SIM, WIPAR TUDO')
            .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
            .setCustomId('rpgwipe:cancel')
            .setLabel('Cancelar')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        // Desabilitar botões após 30s automaticamente
        setTimeout(async () => {
            const disabled = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpgwipe:confirm').setLabel('☢️ SIM, WIPAR TUDO').setStyle(discord_js_1.ButtonStyle.Danger).setDisabled(true), new discord_js_1.ButtonBuilder().setCustomId('rpgwipe:cancel').setLabel('Cancelar').setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true));
            await interaction.editReply({ components: [disabled] }).catch(() => null);
        }, 30000);
    },
};
//# sourceMappingURL=rpgwipe.js.map