"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInventarioEmbed = buildInventarioEmbed;
exports.buildInventarioButtons = buildInventarioButtons;
exports.buildItemActionSelect = buildItemActionSelect;
const discord_js_1 = require("discord.js");
const inventory_1 = require("../services/inventory");
const items_1 = require("../constants/items");
async function buildInventarioEmbed(char) {
    const inv = await (0, inventory_1.getInventory)(char.discordId);
    if (inv.length === 0) {
        return {
            embed: new discord_js_1.EmbedBuilder()
                .setColor(0x95A5A6)
                .setTitle('🎒 Inventário')
                .setDescription('*Seu inventário está vazio! Vá explorar dungeons para conseguir itens.*')
                .setFooter({ text: `💰 Ouro: ${char.gold.toLocaleString('pt-BR')}` }),
            select: null,
        };
    }
    const lines = inv.slice(0, 20).map(invItem => {
        const item = (0, items_1.getItem)(invItem.itemId);
        if (!item)
            return `❓ ${invItem.itemId} x${invItem.quantity}`;
        return `${items_1.RARITY_EMOJI[item.rarity]} ${item.emoji} **${item.name}** ×${invItem.quantity} — *${item.description.slice(0, 50)}*`;
    }).join('\n');
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('🎒 Inventário')
        .setDescription(lines)
        .addFields({ name: '💰 Ouro', value: `**${char.gold.toLocaleString('pt-BR')}**`, inline: true }, { name: '📦 Itens', value: `**${inv.length}**`, inline: true })
        .setFooter({ text: 'Use o menu para equipar, usar ou vender itens.' });
    const selectableItems = inv.filter(invItem => {
        const item = (0, items_1.getItem)(invItem.itemId);
        return item && (item.maxStack === 1 || item.slot === 'consumable');
    }).slice(0, 25);
    const select = selectableItems.length > 0
        ? new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('rpg_select:inventario_acao')
            .setPlaceholder('Selecione um item...')
            .addOptions(selectableItems.map(invItem => {
            const item = (0, items_1.getItem)(invItem.itemId);
            return new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel(`${item.name} ×${invItem.quantity}`)
                .setValue(invItem.itemId)
                .setEmoji(item.emoji.trim())
                .setDescription(`${items_1.RARITY_EMOJI[item.rarity]} ${item.rarity} | ${items_1.SLOT_NAME[item.slot]}`);
        })))
        : null;
    return { embed, select };
}
function buildInventarioButtons() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:inventario').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:loja').setLabel('🛒 Loja').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Dungeon').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Perfil').setStyle(discord_js_1.ButtonStyle.Secondary));
}
function buildItemActionSelect(itemId) {
    const item = (0, items_1.getItem)(itemId);
    if (!item)
        return null;
    const options = [];
    if (item.maxStack === 1) {
        options.push(new discord_js_1.StringSelectMenuOptionBuilder().setLabel('⚔️ Equipar').setValue(`equip:${itemId}`).setDescription('Equipar este item'));
    }
    if (item.slot === 'consumable') {
        options.push(new discord_js_1.StringSelectMenuOptionBuilder().setLabel('🧪 Usar').setValue(`usar:${itemId}`).setDescription('Usar este consumível'));
    }
    options.push(new discord_js_1.StringSelectMenuOptionBuilder().setLabel('💰 Vender (1x)').setValue(`vender:${itemId}`).setDescription(`Receber ${item.sellPrice} ouro`));
    if (options.length === 0)
        return null;
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:item_acao')
        .setPlaceholder(`O que fazer com ${item.name}?`)
        .addOptions(options));
}
//# sourceMappingURL=inventario.js.map