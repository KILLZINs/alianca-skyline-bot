"use strict";
// ═══════════════════════════════════════════════════════════════════════
// FEATURE GATE — habilitar/desabilitar módulos por servidor
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_KEYS = exports.FEATURE_META = void 0;
exports.isFeatureEnabled = isFeatureEnabled;
exports.featureDisabledMsg = featureDisabledMsg;
const helpers_1 = require("./helpers");
exports.FEATURE_META = {
    featLeveling: { label: 'XP / Níveis', emoji: '🎯', desc: 'XP por mensagem, level up e ranking de níveis' },
    featRpg: { label: 'RPG', emoji: '⚔️', desc: 'Sistema RPG completo: dungeon, crafting, skills, etc.' },
    featTickets: { label: 'Tickets / Suporte', emoji: '🎫', desc: 'Sistema de tickets de suporte ao membro' },
    featPolls: { label: 'Enquetes', emoji: '📊', desc: 'Criação de enquetes interativas' },
    featGiveaways: { label: 'Sorteios', emoji: '🎁', desc: 'Sistema de sorteios com participação por botão' },
    featSelfRole: { label: 'Registro de Cargos', emoji: '🎭', desc: 'Menus de auto-cargo para membros escolherem seus cargos' },
    featMissions: { label: 'Missões', emoji: '📋', desc: 'Missões diárias e semanais com recompensas' },
    featSocial: { label: 'Roleplay (/rp)', emoji: '🤝', desc: 'Comandos de roleplay social (abraçar, beijar, etc.)' },
    featEconomy: { label: 'Economia (moedas)', emoji: '🪙', desc: 'Sistema de moedas, loja e transferências' },
    featMod: { label: 'Auto-Moderação', emoji: '🔨', desc: 'Anti-spam, anti-links e moderação automática' },
    featAnnouncements: { label: 'Anúncios / Eventos', emoji: '📢', desc: 'Sistema de anúncios e eventos do servidor' },
};
exports.FEATURE_KEYS = Object.keys(exports.FEATURE_META);
/** Retorna true se a feature está habilitada no servidor (padrão: true). */
async function isFeatureEnabled(guildId, feat) {
    if (!guildId)
        return true;
    try {
        const config = await (0, helpers_1.getConfig)(guildId);
        const val = config[feat];
        return val !== false; // undefined → true (padrão habilitado)
    }
    catch {
        return true; // em caso de erro, não bloquear
    }
}
/** Mensagem ephemeral padrão para features desabilitadas. */
function featureDisabledMsg(feat) {
    const m = exports.FEATURE_META[feat];
    return `❌ **${m.emoji} ${m.label}** está desabilitado neste servidor.\nUm administrador pode habilitá-lo em \`/admin\` → 🔧 **Módulos**.`;
}
//# sourceMappingURL=features.js.map