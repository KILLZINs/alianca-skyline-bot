"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANKS = exports.OWNER_ID = void 0;
exports.xpForNextLevel = xpForNextLevel;
function xpForNextLevel(level) {
    // Fórmula exponencial — muito mais difícil subir de nível em altos níveis
    // Nível 1: 150 | Nível 5: ~594 | Nível 10: ~2350 | Nível 20: ~18500
    return Math.floor(150 * Math.pow(1.4, level - 1));
}
exports.OWNER_ID = process.env.OWNER_ID ?? '1195254699943796791';
exports.RANKS = [
    'Recruta',
    'Membro',
    'Veterano',
    'Elite',
    'Capitão',
    'Comandante',
    'Líder',
];
//# sourceMappingURL=index.js.map