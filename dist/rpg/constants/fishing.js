"use strict";
// ═══════════════════════════════════════════════════════════════════════
// SISTEMA DE PESCA
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.FISHING_ENERGY_COST = exports.FISHING_COOLDOWN_MS = exports.RARITY_LABEL = exports.RARITY_COLOR = exports.FISH_TABLE = void 0;
exports.rollFish = rollFish;
exports.FISH_TABLE = [
    // ── Peixes comuns ───────────────────────────────────────────────────
    { id: 'peixe_pequeno', name: 'Peixe Pequeno', emoji: '🐟', rarity: 'comum', goldValue: 5, weight: 30 },
    { id: 'peixe_listrado', name: 'Peixe Listrado', emoji: '🐠', rarity: 'comum', goldValue: 8, weight: 25 },
    { id: 'baiacu', name: 'Baiacu', emoji: '🐡', rarity: 'comum', goldValue: 10, weight: 20 },
    { id: 'caranguejo', name: 'Caranguejo', emoji: '🦀', rarity: 'incomum', goldValue: 18, weight: 12, hpRestore: 15 },
    { id: 'polvo', name: 'Polvo', emoji: '🐙', rarity: 'incomum', goldValue: 25, weight: 8, energyRestore: 10 },
    // ── Peixes raros ────────────────────────────────────────────────────
    { id: 'peixe_espada', name: 'Peixe-Espada', emoji: '🐬', rarity: 'raro', goldValue: 50, weight: 4, hpRestore: 30 },
    { id: 'atum_real', name: 'Atum Real', emoji: '🐟', rarity: 'raro', goldValue: 70, weight: 3, energyRestore: 20 },
    { id: 'tubarao_azul', name: 'Tubarão Azul', emoji: '🦈', rarity: 'raro', goldValue: 90, weight: 2 },
    // ── Épicos e lendários ───────────────────────────────────────────────
    { id: 'cobra_mar', name: 'Cobra do Mar', emoji: '🐍', rarity: 'epico', goldValue: 150, weight: 1, hpRestore: 50, energyRestore: 30 },
    { id: 'dragao_mar', name: 'Dragão do Mar', emoji: '🐲', rarity: 'lendario', goldValue: 500, weight: 0.3, hpRestore: 100, energyRestore: 50 },
    // ── Tesouros (surpresa) ──────────────────────────────────────────────
    { id: 'bau_afogado', name: 'Baú Afogado', emoji: '📦', rarity: 'raro', goldValue: 80, weight: 1.5 },
    { id: 'moedas_antigas', name: 'Moedas Antigas', emoji: '🪙', rarity: 'epico', goldValue: 200, weight: 0.7 },
    // ── Lixo (acontece) ──────────────────────────────────────────────────
    { id: 'bota_velha', name: 'Bota Velha', emoji: '👢', rarity: 'comum', goldValue: 1, weight: 10 },
    { id: 'lata_enferrujada', name: 'Lata Enferrujada', emoji: '🥫', rarity: 'comum', goldValue: 2, weight: 8 },
];
exports.RARITY_COLOR = {
    comum: 0x888888, incomum: 0x2ECC71, raro: 0x3498DB, epico: 0x9B59B6, lendario: 0xFFD700,
};
exports.RARITY_LABEL = {
    comum: 'Comum', incomum: 'Incomum', raro: '🔵 Raro', epico: '🟣 Épico', lendario: '⭐ Lendário',
};
/** Sorteia um peixe baseado em peso, com bonus de crepúsculo */
function rollFish(fishBonus = 0) {
    const table = exports.FISH_TABLE.map(f => ({
        ...f,
        weight: f.rarity === 'comum' ? f.weight : f.weight * (1 + fishBonus),
    }));
    const total = table.reduce((s, f) => s + f.weight, 0);
    let rng = Math.random() * total;
    for (const fish of table) {
        rng -= fish.weight;
        if (rng <= 0)
            return fish;
    }
    return table[0];
}
/** Cooldown de pesca em ms (2 minutos) */
exports.FISHING_COOLDOWN_MS = 2 * 60 * 1000;
exports.FISHING_ENERGY_COST = 5;
//# sourceMappingURL=fishing.js.map