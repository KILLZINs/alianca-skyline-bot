"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE CASAMENTO — propor, aceitar, rejeitar, divorciar
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMarriageEmbed = buildMarriageEmbed;
exports.buildMarriageButtons = buildMarriageButtons;
exports.buildProposalModal = buildProposalModal;
exports.buildDivorceConfirmEmbed = buildDivorceConfirmEmbed;
const discord_js_1 = require("discord.js");
const marriage_1 = require("../services/marriage");
// ─── Embed de casamento ────────────────────────────────────────────────
async function buildMarriageEmbed(userId, client) {
    const marriage = await (0, marriage_1.getMarriage)(userId);
    const proposals = await (0, marriage_1.getPendingProposals)(userId);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle('💍 Sistema de Casamento');
    if (marriage) {
        const partnerId = (0, marriage_1.getPartner)(marriage, userId);
        let partnerName = `<@${partnerId}>`;
        try {
            const user = await client.users.fetch(partnerId);
            partnerName = user.username;
        }
        catch { /* user may not be cached */ }
        const daysTogether = Math.floor((Date.now() - marriage.marriedAt.getTime()) / 86400000);
        const anniversary = marriage.marriedAt.toLocaleDateString('pt-BR');
        embed.setDescription(`💑 **Você está casado(a)!**\n\n` +
            `💕 **Parceiro(a):** <@${partnerId}> (${partnerName})\n` +
            `📅 **Casados desde:** ${anniversary}\n` +
            `💫 **Dias juntos:** **${daysTogether}** dia(s)\n\n` +
            `*"O amor é a força mais poderosa do mundo."* 🌹`);
    }
    else {
        embed.setDescription('💔 **Você está solteiro(a).**\n\n' +
            'O casamento traz bônus especiais:\n' +
            '💞 Ações de RP exclusivas para casais\n' +
            '⭐ Bônus de XP e Ouro em batalhas juntos\n' +
            '🌹 Exibição no perfil RPG\n\n' +
            'Use o botão abaixo para propor casamento a alguém!');
    }
    if (proposals.length > 0) {
        const proposalLines = proposals.slice(0, 3).map(p => `💌 <@${p.proposerId}> — expira em ${Math.max(0, Math.floor((p.expiresAt.getTime() - Date.now()) / 3600000))}h`).join('\n');
        embed.addFields({ name: `💌 Pedidos de Casamento (${proposals.length})`, value: proposalLines });
    }
    embed.setFooter({ text: '⚔️ Aliança Skyline RPG — Sistema de Casamento' });
    return embed;
}
// ─── Botões de casamento ───────────────────────────────────────────────
async function buildMarriageButtons(userId) {
    const marriage = await (0, marriage_1.getMarriage)(userId);
    const proposals = await (0, marriage_1.getPendingProposals)(userId);
    const rows = [];
    if (marriage) {
        rows.push(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('rpg:casamento_divorciar_confirmar')
            .setLabel('💔 Divorciar')
            .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
            .setCustomId('rpg:cidade')
            .setLabel('◀ Voltar')
            .setStyle(discord_js_1.ButtonStyle.Secondary)));
    }
    else {
        rows.push(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('rpg:casamento_propor')
            .setLabel('💍 Propor Casamento')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId('rpg:casamento')
            .setLabel('🔄 Atualizar')
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId('rpg:cidade')
            .setLabel('◀ Voltar')
            .setStyle(discord_js_1.ButtonStyle.Secondary)));
    }
    // Botões para aceitar/rejeitar propostas (até 3)
    for (const proposal of proposals.slice(0, 2)) {
        rows.push(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`rpg:casamento_aceitar:${proposal.id}`)
            .setLabel(`✅ Aceitar de <@${proposal.proposerId}>`.slice(0, 80))
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId(`rpg:casamento_rejeitar:${proposal.id}`)
            .setLabel('❌ Recusar')
            .setStyle(discord_js_1.ButtonStyle.Danger)));
    }
    return rows;
}
// ─── Modal de proposta ─────────────────────────────────────────────────
function buildProposalModal() {
    return new discord_js_1.ModalBuilder()
        .setCustomId('rpg_modal:casamento_propor')
        .setTitle('💍 Propor Casamento')
        .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
        .setCustomId('target_id')
        .setLabel('ID do usuário (copie o ID do Discord)')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('Ex: 123456789012345678')
        .setMinLength(17)
        .setMaxLength(20)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
        .setCustomId('mensagem')
        .setLabel('Mensagem Romântica (opcional)')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setRequired(false)
        .setPlaceholder('Escreva algo especial... 💕')
        .setMaxLength(300)));
}
// ─── Confirmação de divórcio ───────────────────────────────────────────
function buildDivorceConfirmEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('💔 Confirmar Divórcio')
        .setDescription('⚠️ Tem certeza que deseja se divorciar?\n\n' +
        'Esta ação **não pode ser desfeita**.\n' +
        'Você perderá todos os benefícios do casamento.');
}
//# sourceMappingURL=marriage.js.map