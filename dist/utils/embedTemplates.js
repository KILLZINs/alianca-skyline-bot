"use strict";
// ═══════════════════════════════════════════════════════════════════════
// SISTEMA DE TEMPLATES DE EMBEDS — customização total por embed
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMBED_CATEGORIES = exports.EMBED_CATALOG = void 0;
exports.loadEmbedTemplates = loadEmbedTemplates;
exports.getTemplate = getTemplate;
exports.applyTemplate = applyTemplate;
exports.setTemplateField = setTemplateField;
exports.clearTemplate = clearTemplate;
exports.hexToInt = hexToInt;
exports.intToHex = intToHex;
const client_1 = require("../database/client");
exports.EMBED_CATALOG = {
    // Geral
    'welcome.channel': { label: '👋 Boas-vindas (canal)', category: 'geral', desc: 'Embed de boas-vindas enviado no canal quando um membro entra' },
    'welcome.dm': { label: '📩 Boas-vindas (DM)', category: 'geral', desc: 'DM enviada automaticamente ao novo membro' },
    'levelup': { label: '🎯 Level Up', category: 'geral', desc: 'Notificação de subida de nível (sistema de XP)' },
    'rp': { label: '🎭 Roleplay (/rp)', category: 'geral', desc: 'Embed das ações de roleplay' },
    'painel': { label: '⚔️ Painel Principal', category: 'geral', desc: 'Painel principal do bot (/painel)' },
    // RPG
    'combat.victory': { label: '🏆 Vitória no Combate', category: 'rpg', desc: 'Resultado quando vence um combate' },
    'combat.defeat': { label: '💀 Derrota no Combate', category: 'rpg', desc: 'Resultado quando perde um combate' },
    'combat.draw': { label: '💥 Empate no Combate', category: 'rpg', desc: 'Resultado de empate' },
    // Boss Mundial
    'worldboss.spawn': { label: '🐉 Boss Mundial — Spawn', category: 'bossmundial', desc: 'Embed quando um Boss Mundial é invocado' },
    'worldboss.defeated': { label: '🏆 Boss Mundial — Derrota', category: 'bossmundial', desc: 'Embed quando o Boss Mundial é derrotado' },
    'worldboss.expired': { label: '⏰ Boss Mundial — Expirado', category: 'bossmundial', desc: 'Embed quando o Boss Mundial expira sem ser derrotado' },
    // Casamento
    'marriage.proposal': { label: '💍 Proposta de Casamento', category: 'casamento', desc: 'Embed de proposta de casamento enviada' },
    'marriage.married': { label: '💒 Casamento Realizado', category: 'casamento', desc: 'Embed de confirmação de casamento' },
    'marriage.divorced': { label: '💔 Divórcio', category: 'casamento', desc: 'Embed quando um casal se divorcia' },
    // Missões
    'mission.daily.complete': { label: '📋 Missão Diária Completa', category: 'missoes', desc: 'Embed de missão diária concluída' },
    'mission.weekly.complete': { label: '📆 Missão Semanal Completa', category: 'missoes', desc: 'Embed de missão semanal concluída' },
    // Aliança
    'alliance.official': { label: '🌐 Embed Oficial Aliança', category: 'alianca', desc: 'Embed com lista oficial dos servidores da aliança' },
    // Tickets
    'ticket.create': { label: '🎫 Ticket Criado', category: 'tickets', desc: 'Embed exibido quando um ticket é aberto' },
    'ticket.close': { label: '🔒 Ticket Fechado', category: 'tickets', desc: 'Embed exibido quando um ticket é fechado' },
    'ticket.claim': { label: '🛡️ Ticket Assumido', category: 'tickets', desc: 'Embed quando um moderador assume o ticket' },
    // Sorteios
    'giveaway.start': { label: '🎁 Sorteio Iniciado', category: 'sorteios', desc: 'Embed do sorteio ativo aguardando participantes' },
    'giveaway.win': { label: '🏆 Vencedor do Sorteio', category: 'sorteios', desc: 'Embed de anúncio dos vencedores' },
    // Moderação
    'mod.warn': { label: '⚠️ Aviso Emitido', category: 'moderacao', desc: 'Embed de aviso de moderação aplicado' },
    'mod.ban': { label: '🔨 Ban Aplicado', category: 'moderacao', desc: 'Embed de ban aplicado ao membro' },
    'mod.kick': { label: '👢 Kick Aplicado', category: 'moderacao', desc: 'Embed de kick aplicado ao membro' },
    // Registro de Cargos
    'selfrole.add': { label: '✅ Cargo Adicionado', category: 'selfrole', desc: 'Mensagem ephemeral quando o membro recebe um cargo' },
    'selfrole.remove': { label: '❌ Cargo Removido', category: 'selfrole', desc: 'Mensagem ephemeral quando o membro perde um cargo' },
    // RPG miscelânea
    'rpg.levelup': { label: '🌟 Level Up RPG', category: 'rpg', desc: 'Notificação de subida de nível no RPG' },
    'rpg.reincarnation': { label: '✨ Reencarnação RPG', category: 'rpg', desc: 'Embed de reencarnação do personagem' },
    'rpg.marriage.proposal': { label: '💍 Proposta de Casamento RPG', category: 'rpg', desc: 'Proposta de casamento dentro do RPG' },
};
exports.EMBED_CATEGORIES = {
    geral: '🎯 Geral',
    rpg: '⚔️ RPG',
    bossmundial: '🐉 Boss Mundial',
    casamento: '💍 Casamento',
    missoes: '📋 Missões',
    alianca: '🌐 Aliança',
    tickets: '🎫 Tickets',
    sorteios: '🎁 Sorteios',
    moderacao: '🔨 Moderação',
    selfrole: '🎭 Registro de Cargos',
};
// ── Cache em memória ───────────────────────────────────────────────────
const _cache = new Map();
async function loadEmbedTemplates() {
    try {
        const rows = await client_1.prisma.embedTemplate.findMany();
        _cache.clear();
        for (const row of rows)
            _cache.set(row.key, row);
        console.log(`✅ ${rows.length} template(s) de embed carregado(s)`);
    }
    catch (err) {
        console.warn('⚠️ Tabela embed_templates não existe ainda — execute o SQL de migração.');
    }
}
function getTemplate(key) {
    return _cache.get(key);
}
function applyTemplate(embed, key) {
    const tpl = getTemplate(key);
    if (!tpl)
        return embed;
    if (tpl.title)
        embed.setTitle(tpl.title);
    if (tpl.description)
        embed.setDescription(tpl.description);
    if (tpl.color !== null && tpl.color !== undefined)
        embed.setColor(tpl.color);
    if (tpl.thumbnailUrl)
        embed.setThumbnail(tpl.thumbnailUrl);
    if (tpl.imageUrl)
        embed.setImage(tpl.imageUrl);
    if (tpl.footerText && tpl.footerIcon)
        embed.setFooter({ text: tpl.footerText, iconURL: tpl.footerIcon });
    else if (tpl.footerText)
        embed.setFooter({ text: tpl.footerText });
    else if (tpl.footerIcon) {
        const existing = embed.data.footer;
        if (existing?.text)
            embed.setFooter({ text: existing.text, iconURL: tpl.footerIcon });
    }
    return embed;
}
// ── CRUD ───────────────────────────────────────────────────────────────
async function setTemplateField(key, field, value) {
    const data = { [field]: value };
    const updated = await client_1.prisma.embedTemplate.upsert({
        where: { key },
        update: data,
        create: { key, ...data },
    });
    const cast = updated;
    _cache.set(key, cast);
    return cast;
}
async function clearTemplate(key) {
    await client_1.prisma.embedTemplate.deleteMany({ where: { key } }).catch(() => null);
    _cache.delete(key);
}
function hexToInt(hex) {
    const clean = hex.replace(/^#/, '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(clean))
        return null;
    return parseInt(clean, 16);
}
function intToHex(n) {
    return '#' + n.toString(16).padStart(6, '0').toUpperCase();
}

// ── Refresh de URLs do Discord CDN ───────────────────────────────────────────
function isDiscordUrlExpiredSoon(url) {
    try {
        const match = url.match(/[?&]ex=([a-fA-F0-9]+)/);
        if (!match) return false;
        const expiryMs = parseInt(match[1], 16) * 1000;
        return expiryMs < Date.now() + 12 * 60 * 60 * 1000;
    } catch { return false; }
}
async function refreshImageUrls(botToken) {
    const imageFields = ['imageUrl', 'thumbnailUrl', 'footerIcon'];
    const urlToTargets = new Map();
    for (const [key, tpl] of _cache.entries()) {
        for (const field of imageFields) {
            const url = tpl[field];
            if (url && isDiscordUrlExpiredSoon(url)) {
                const list = urlToTargets.get(url) ?? [];
                list.push({ key, field });
                urlToTargets.set(url, list);
            }
        }
    }
    if (urlToTargets.size === 0) return;
    console.log('[EmbedTemplates] Refreshing ' + urlToTargets.size + ' CDN URL(s)...');
    try {
        const res = await fetch('https://discord.com/api/v10/attachments/refresh-urls', {
            method: 'POST',
            headers: { Authorization: 'Bot ' + botToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ attachment_urls: [...urlToTargets.keys()] }),
        });
        if (!res.ok) { console.warn('[EmbedTemplates] refresh-urls returned ' + res.status); return; }
        const data = await res.json();
        for (const { original, refreshed } of data.refreshed_urls) {
            for (const { key, field } of urlToTargets.get(original) ?? []) {
                await client_1.prisma.embedTemplate.update({ where: { key }, data: { [field]: refreshed } }).catch(() => null);
                const cached = _cache.get(key);
                if (cached) cached[field] = refreshed;
            }
        }
        console.log('[EmbedTemplates] ' + data.refreshed_urls.length + ' URL(s) renovada(s).');
    } catch (err) { console.error('[EmbedTemplates] Falha ao renovar URLs:', err); }
}
exports.refreshImageUrls = refreshImageUrls;
//# sourceMappingURL=embedTemplates.js.map