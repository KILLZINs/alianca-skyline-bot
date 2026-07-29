"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildForjaEmbed = buildForjaEmbed;
exports.craftItem = craftItem;
const discord_js_1 = require("discord.js");
const items_1 = require("../constants/items");
const client_1 = require("../../database/client");
function buildForjaEmbed(char) {
    const available = items_1.CRAFT_RECIPES.filter(r => char.level >= r.minLevel);
    const lines = available.map(r => {
        const out = (0, items_1.getItem)(r.outputItem);
        const ingr = r.ingredients.map(i => `${i.qty}x ${(0, items_1.getItem)(i.itemId)?.name ?? i.itemId}`).join(', ');
        return `${out?.emoji ?? '❓'} **${out?.name ?? r.outputItem}** ×${r.outputQty}\n> 📦 ${ingr} | ⏱️ ${r.craftTimeMin}min`;
    }).join('\n\n') || '*Nenhuma receita disponível no seu nível.*';
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x795548)
        .setTitle('⚒️ Forja')
        .setDescription('Combine materiais para criar equipamentos e consumíveis poderosos!')
        .addFields({ name: '📋 Receitas Disponíveis', value: lines })
        .setFooter({ text: `Nível ${char.level} | ⚒️ Aliança Skyline RPG` });
    const select = available.length > 0
        ? new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('rpg_select:forja_receita')
            .setPlaceholder('Selecione a receita para fabricar...')
            .addOptions(available.slice(0, 25).map(r => {
            const out = (0, items_1.getItem)(r.outputItem);
            return new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel(`${out?.name ?? r.outputItem} ×${r.outputQty}`)
                .setValue(r.id)
                .setEmoji((out?.emoji ?? '⚒️').trim())
                .setDescription(`${r.craftTimeMin}min | Nv.${r.minLevel}+`);
        })))
        : null;
    return { embed, select };
}
async function craftItem(discordId, recipeId) {
    const recipe = items_1.CRAFT_RECIPES.find(r => r.id === recipeId);
    if (!recipe)
        return { success: false, message: 'Receita inválida.' };
    const char = await client_1.prisma.rpgCharacter.findUnique({ where: { discordId } });
    if (!char)
        return { success: false, message: 'Personagem não encontrado.' };
    if (char.level < recipe.minLevel)
        return { success: false, message: `Precisa ser nível **${recipe.minLevel}** para esta receita.` };
    // Verificar ingredientes
    const inv = await client_1.prisma.rpgInventoryItem.findMany({ where: { characterId: discordId } });
    const invMap = new Map(inv.map(i => [i.itemId, i.quantity]));
    for (const ingr of recipe.ingredients) {
        const qty = invMap.get(ingr.itemId) ?? 0;
        if (qty < ingr.qty) {
            const item = (0, items_1.getItem)(ingr.itemId);
            return { success: false, message: `Ingrediente insuficiente: **${ingr.qty}x ${item?.name ?? ingr.itemId}** (você tem ${qty}).` };
        }
    }
    // Consumir ingredientes
    for (const ingr of recipe.ingredients) {
        const current = invMap.get(ingr.itemId) ?? 0;
        if (current <= ingr.qty) {
            await client_1.prisma.rpgInventoryItem.delete({ where: { characterId_itemId: { characterId: discordId, itemId: ingr.itemId } } });
        }
        else {
            await client_1.prisma.rpgInventoryItem.update({
                where: { characterId_itemId: { characterId: discordId, itemId: ingr.itemId } },
                data: { quantity: { decrement: ingr.qty } },
            });
        }
    }
    // Dar o item craftado
    await client_1.prisma.rpgInventoryItem.upsert({
        where: { characterId_itemId: { characterId: discordId, itemId: recipe.outputItem } },
        update: { quantity: { increment: recipe.outputQty } },
        create: { characterId: discordId, itemId: recipe.outputItem, quantity: recipe.outputQty },
    });
    const out = (0, items_1.getItem)(recipe.outputItem);
    return { success: true, message: `⚒️ Fabricou **${recipe.outputQty}x ${out?.emoji ?? ''} ${out?.name ?? recipe.outputItem}** com sucesso!` };
}
//# sourceMappingURL=forja.js.map