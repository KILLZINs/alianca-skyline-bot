"use strict";
// ═══════════════════════════════════════════════════════════════════════
// SERVIÇO DE INVENTÁRIO
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventory = getInventory;
exports.equipItem = equipItem;
exports.unequipItem = unequipItem;
exports.useConsumable = useConsumable;
exports.sellItem = sellItem;
exports.buyItem = buyItem;
const client_1 = require("../../database/client");
const items_1 = require("../constants/items");
const character_1 = require("./character");
async function getInventory(discordId) {
    return client_1.prisma.rpgInventoryItem.findMany({
        where: { characterId: discordId },
        orderBy: { itemId: 'asc' },
    });
}
async function equipItem(discordId, itemId) {
    const item = (0, items_1.getItem)(itemId);
    if (!item)
        return { success: false, message: 'Item não encontrado.' };
    if (item.maxStack !== 1)
        return { success: false, message: 'Esse item não pode ser equipado.' };
    const char = await (0, character_1.getCharacter)(discordId);
    if (!char)
        return { success: false, message: 'Personagem não encontrado.' };
    if (char.level < item.minLevel)
        return { success: false, message: `Precisa ser nível **${item.minLevel}** para equipar esse item.` };
    // verificar restrição de classe
    if (item.classRestriction && !item.classRestriction.includes(char.class)) {
        return { success: false, message: `Apenas ${item.classRestriction.join(', ')} podem usar este item.` };
    }
    const invItem = await client_1.prisma.rpgInventoryItem.findUnique({
        where: { characterId_itemId: { characterId: discordId, itemId } },
    });
    if (!invItem || invItem.quantity < 1)
        return { success: false, message: 'Você não tem esse item no inventário.' };
    const slot = item.slot;
    const eq = char.equipment;
    if (!eq)
        return { success: false, message: 'Equipamento não inicializado.' };
    // BUG FIX: usar transação para evitar race condition / duplicação de itens
    await client_1.prisma.$transaction(async (tx) => {
        // se havia algo equipado no slot, retorna ao inventário
        const currentEquipped = eq[slot];
        if (currentEquipped) {
            await tx.rpgInventoryItem.upsert({
                where: { characterId_itemId: { characterId: discordId, itemId: currentEquipped } },
                update: { quantity: { increment: 1 } },
                create: { characterId: discordId, itemId: currentEquipped, quantity: 1 },
            });
        }
        // equipa o novo
        await tx.rpgEquipment.update({
            where: { characterId: discordId },
            data: { [slot]: itemId },
        });
        // remove do inventário (ou decrementa)
        if (invItem.quantity <= 1) {
            await tx.rpgInventoryItem.delete({ where: { characterId_itemId: { characterId: discordId, itemId } } });
        }
        else {
            await tx.rpgInventoryItem.update({
                where: { characterId_itemId: { characterId: discordId, itemId } },
                data: { quantity: { decrement: 1 } },
            });
        }
    });
    return { success: true, message: `✅ **${item.name}** ${item.emoji} equipado no slot **${items_1.SLOT_NAME[item.slot]}**!` };
}
async function unequipItem(discordId, slot) {
    const char = await (0, character_1.getCharacter)(discordId);
    if (!char?.equipment)
        return { success: false, message: 'Personagem não encontrado.' };
    const eq = char.equipment;
    const itemId = eq[slot];
    if (!itemId)
        return { success: false, message: `Nenhum item equipado no slot **${items_1.SLOT_NAME[slot] ?? slot}**.` };
    const item = (0, items_1.getItem)(itemId);
    await Promise.all([
        client_1.prisma.rpgEquipment.update({ where: { characterId: discordId }, data: { [slot]: null } }),
        client_1.prisma.rpgInventoryItem.upsert({
            where: { characterId_itemId: { characterId: discordId, itemId } },
            update: { quantity: { increment: 1 } },
            create: { characterId: discordId, itemId, quantity: 1 },
        }),
    ]);
    return { success: true, message: `✅ **${item?.name ?? itemId}** removido do slot **${items_1.SLOT_NAME[slot] ?? slot}**.` };
}
async function useConsumable(discordId, itemId) {
    const item = (0, items_1.getItem)(itemId);
    if (!item || item.slot !== 'consumable')
        return { success: false, message: 'Item não é consumível.' };
    const invItem = await client_1.prisma.rpgInventoryItem.findUnique({
        where: { characterId_itemId: { characterId: discordId, itemId } },
    });
    if (!invItem || invItem.quantity < 1)
        return { success: false, message: 'Você não tem esse item.' };
    const char = await (0, character_1.getCharacter)(discordId);
    if (!char)
        return { success: false, message: 'Personagem não encontrado.' };
    let resultMsg = '';
    const updates = {};
    if (item.stats.hp) {
        const heal = item.id === 'pocao_de_vida_g' ? char.maxHp - char.currentHp : Math.min(item.stats.hp, char.maxHp - char.currentHp);
        updates.currentHp = { increment: heal };
        resultMsg = `❤️ Restaurou **${heal} HP**!`;
    }
    else if (item.stats.energy) {
        const en = Math.min(item.stats.energy, char.maxEnergy - char.currentEnergy);
        updates.currentEnergy = { increment: en };
        resultMsg = `⚡ Restaurou **${en} Energia**!`;
    }
    else if (item.id === 'elixir_de_xp') {
        resultMsg = `💜 Elixir ativado! 2x XP nas próximas 5 batalhas. *(efeito em breve)*`;
    }
    else if (item.id === 'pergaminho_de_tele') {
        updates.currentLocation = 'cidade_inicial';
        updates.lastTravel = null;
        resultMsg = `📜 Teletransportado para a **Cidade da Aliança**!`;
    }
    else {
        resultMsg = `Usou **${item.name}**. ${item.effect ?? ''}`;
    }
    if (Object.keys(updates).length > 0) {
        await client_1.prisma.rpgCharacter.update({ where: { discordId }, data: updates });
    }
    // consome item
    if (invItem.quantity <= 1) {
        await client_1.prisma.rpgInventoryItem.delete({ where: { characterId_itemId: { characterId: discordId, itemId } } });
    }
    else {
        await client_1.prisma.rpgInventoryItem.update({
            where: { characterId_itemId: { characterId: discordId, itemId } },
            data: { quantity: { decrement: 1 } },
        });
    }
    return { success: true, message: `${item.emoji} ${resultMsg}` };
}
async function sellItem(discordId, itemId, qty = 1) {
    const item = (0, items_1.getItem)(itemId);
    if (!item)
        return { success: false, message: 'Item não encontrado.' };
    const invItem = await client_1.prisma.rpgInventoryItem.findUnique({
        where: { characterId_itemId: { characterId: discordId, itemId } },
    });
    if (!invItem || invItem.quantity < qty)
        return { success: false, message: `Você não tem **${qty}x ${item.name}** suficientes.` };
    const totalGold = item.sellPrice * qty;
    await Promise.all([
        client_1.prisma.rpgCharacter.update({ where: { discordId }, data: { gold: { increment: totalGold } } }),
        invItem.quantity <= qty
            ? client_1.prisma.rpgInventoryItem.delete({ where: { characterId_itemId: { characterId: discordId, itemId } } })
            : client_1.prisma.rpgInventoryItem.update({
                where: { characterId_itemId: { characterId: discordId, itemId } },
                data: { quantity: { decrement: qty } },
            }),
    ]);
    return { success: true, message: `💰 Vendeu **${qty}x ${item.name}** por **${totalGold} ouro**!` };
}
async function buyItem(discordId, itemId, qty = 1) {
    const item = (0, items_1.getItem)(itemId);
    if (!item || item.price === 0)
        return { success: false, message: 'Este item não está disponível na loja.' };
    const char = await (0, character_1.getCharacter)(discordId);
    if (!char)
        return { success: false, message: 'Personagem não encontrado.' };
    const totalCost = item.price * qty;
    if (char.gold < totalCost)
        return { success: false, message: `Ouro insuficiente! Precisa de **${totalCost}** mas tem **${char.gold}**.` };
    if (char.level < item.minLevel)
        return { success: false, message: `Precisa ser nível **${item.minLevel}** para comprar este item.` };
    await Promise.all([
        client_1.prisma.rpgCharacter.update({ where: { discordId }, data: { gold: { decrement: totalCost } } }),
        client_1.prisma.rpgInventoryItem.upsert({
            where: { characterId_itemId: { characterId: discordId, itemId } },
            update: { quantity: { increment: qty } },
            create: { characterId: discordId, itemId, quantity: qty },
        }),
    ]);
    return { success: true, message: `${item.emoji} Comprou **${qty}x ${item.name}** por **${totalCost} ouro**!` };
}
//# sourceMappingURL=inventory.js.map