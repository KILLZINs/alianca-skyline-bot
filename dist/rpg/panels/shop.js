"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildShopEmbed = buildShopEmbed;
exports.buildShopCategorySelect = buildShopCategorySelect;
exports.buildShopItemSelect = buildShopItemSelect;
exports.buildShopButtons = buildShopButtons;
const discord_js_1 = require("discord.js");
const items_1 = require("../constants/items");
const SHOP_CATEGORIES = [
    { id: 'weapon', label: '⚔️ Armas', emoji: '⚔️' },
    { id: 'helmet', label: '⛑️ Elmos', emoji: '⛑️' },
    { id: 'pants', label: '👖 Calças', emoji: '👖' },
    { id: 'boots', label: '👟 Botas', emoji: '👟' },
    { id: 'gloves', label: '🧤 Luvas', emoji: '🧤' },
    { id: 'shield', label: '🛡️ Escudos', emoji: '🛡️' },
    { id: 'ring', label: '💍 Anéis', emoji: '💍' },
    { id: 'consumable', label: '🧪 Consumíveis', emoji: '🧪' },
    { id: 'pet', label: '🐾 Pets', emoji: '🐾' },
];
function buildShopEmbed(char, category) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xF39C12)
        .setTitle('🛒 Loja da Aliança')
        .setFooter({ text: `💰 Seu ouro: ${char.gold.toLocaleString('pt-BR')}` });
    if (!category) {
        embed.setDescription('Selecione uma categoria para ver os itens disponíveis.')
            .addFields(SHOP_CATEGORIES.map(c => ({ name: c.label, value: '`Selecione abaixo`', inline: true })));
        return embed;
    }
    const items = items_1.ITEM_LIST.filter(i => i.slot === category && i.price > 0 && i.minLevel <= char.level + 5);
    if (items.length === 0) {
        embed.setDescription(`Nenhum item disponível em **${category}** para seu nível.`);
        return embed;
    }
    const cat = SHOP_CATEGORIES.find(c => c.id === category);
    embed.setTitle(`🛒 Loja — ${cat?.label ?? category}`);
    const lines = items.slice(0, 15).map(i => `${items_1.RARITY_EMOJI[i.rarity]} ${i.emoji} **${i.name}** — 💰 **${i.price}** ouro\n` +
        `> Nv.${i.minLevel}+ | ${i.description}`).join('\n\n');
    embed.setDescription(lines || '*Sem itens disponíveis.*');
    return embed;
}
function buildShopCategorySelect() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:loja_categoria')
        .setPlaceholder('Selecione a categoria...')
        .addOptions(SHOP_CATEGORIES.map(c => new discord_js_1.StringSelectMenuOptionBuilder().setLabel(c.label).setValue(c.id).setEmoji(c.emoji.trim()))));
}
function buildShopItemSelect(char, category) {
    const items = items_1.ITEM_LIST.filter(i => i.slot === category && i.price > 0 && i.minLevel <= char.level + 5);
    if (items.length === 0)
        return null;
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:loja_comprar')
        .setPlaceholder('Selecione o item para comprar...')
        .addOptions(items.slice(0, 25).map(i => new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel(`${i.name} — ${i.price} 💰`)
        .setValue(i.id)
        .setEmoji(i.emoji.trim())
        .setDescription(`${items_1.RARITY_EMOJI[i.rarity]} ${i.rarity} | Nv.${i.minLevel}+`))));
}
function buildShopButtons(category) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:loja').setLabel('🛒 Categorias').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:cidade').setLabel('◀ Cidade').setStyle(discord_js_1.ButtonStyle.Secondary));
}
//# sourceMappingURL=shop.js.map