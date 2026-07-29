"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG_DEFAULTS = void 0;
exports.getBotConfig = getBotConfig;
exports.loadBotConfig = loadBotConfig;
exports.updateBotConfig = updateBotConfig;
exports.hexToInt = hexToInt;
exports.intToHex = intToHex;
const client_1 = require("../database/client");
// ─── Padrões ──────────────────────────────────────────────────────────────────
exports.CONFIG_DEFAULTS = {
    footerText: '⚔️ Aliança Skyline',
    primaryColor: 0x9b59b6,
    botIconUrl: null,
    rpFooterText: '⚔️ Aliança Skyline • /genero para mudar seus pronomes',
    featAfk: true,
    featWelcomeDm: true,
};
// ─── Cache em memória (carregado no ready) ────────────────────────────────────
let _cache = { ...exports.CONFIG_DEFAULTS };
function getBotConfig() {
    return _cache;
}
async function loadBotConfig() {
    try {
        const row = await client_1.prisma.botConfig.findUnique({ where: { id: 'global' } });
        if (row) {
            _cache = {
                footerText: row.footerText,
                primaryColor: row.primaryColor,
                botIconUrl: row.botIconUrl,
                rpFooterText: row.rpFooterText,
                featAfk: row.featAfk ?? true,
                featWelcomeDm: row.featWelcomeDm ?? true,
            };
        }
        else {
            _cache = { ...exports.CONFIG_DEFAULTS };
        }
    }
    catch {
        // Tabela ainda não criada → usa defaults sem crash
        _cache = { ...exports.CONFIG_DEFAULTS };
    }
}
async function updateBotConfig(data) {
    // Atualiza o cache IMEDIATAMENTE (optimistic) antes do await do DB
    _cache = { ..._cache, ...data };
    const snapshot = { ..._cache };
    await client_1.prisma.botConfig.upsert({
        where: { id: 'global' },
        update: data,
        create: { id: 'global', ...snapshot },
    });
    return _cache;
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
/** "#9b59b6" ou "9b59b6" → número inteiro, ou null se inválido */
function hexToInt(hex) {
    const clean = hex.replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(clean))
        return null;
    return parseInt(clean, 16);
}
/** 0x9b59b6 → "#9B59B6" */
function intToHex(n) {
    return '#' + n.toString(16).padStart(6, '0').toUpperCase();
}
//# sourceMappingURL=botConfig.js.map