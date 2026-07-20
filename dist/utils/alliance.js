"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_CLASSES = void 0;
exports.getServerClass = getServerClass;
exports.getNextClass = getNextClass;
exports.getAllianceServers = getAllianceServers;
exports.isAllianceServer = isAllianceServer;
exports.buildOfficialAllianceEmbed = buildOfficialAllianceEmbed;
exports.updateAllServerClasses = updateAllServerClasses;
const discord_js_1 = require("discord.js");
const client_1 = require("../database/client");
const embeds_1 = require("./embeds");
exports.SERVER_CLASSES = [
    { name: 'Cosmos', emoji: '🌌', color: 0x9B59B6, minMembers: 10000 },
    { name: 'Galaxy', emoji: '🌠', color: 0x8E44AD, minMembers: 5000 },
    { name: 'Nebula', emoji: '✨', color: 0x7D3C98, minMembers: 3000 },
    { name: 'Starlight', emoji: '⭐', color: 0x6C3483, minMembers: 1000 },
    { name: 'Moonlight', emoji: '🌙', color: 0x5B2C6F, minMembers: 500 },
    { name: 'Cloud', emoji: '☁️', color: 0x4A235A, minMembers: 100 },
];
function getServerClass(memberCount) {
    for (const cls of exports.SERVER_CLASSES) {
        if (memberCount >= cls.minMembers)
            return cls;
    }
    return { name: 'Sem Classe', emoji: '⚪', color: 0x808080, minMembers: 0 };
}
function getNextClass(memberCount) {
    const ascending = [...exports.SERVER_CLASSES].reverse();
    for (const cls of ascending) {
        if (memberCount < cls.minMembers)
            return { cls, needed: cls.minMembers - memberCount };
    }
    return null; // já no topo (Cosmos)
}
async function getAllianceServers() {
    return client_1.prisma.allianceServer.findMany({
        include: { members: true },
        orderBy: { memberCount: 'desc' },
    });
}
async function isAllianceServer(guildId) {
    return !!(await client_1.prisma.allianceServer.findUnique({ where: { guildId } }));
}
// ─── Constrói embed oficial da aliança ────────────────────────────────────────
async function buildOfficialAllianceEmbed(client) {
    const servers = await getAllianceServers();
    // Agrupa por classe
    const grouped = new Map();
    for (const cls of exports.SERVER_CLASSES)
        grouped.set(cls.name, []);
    grouped.set('Sem Classe', []);
    for (const s of servers) {
        const cls = getServerClass(s.memberCount);
        const arr = grouped.get(cls.name) ?? [];
        arr.push(s);
        grouped.set(cls.name, arr);
    }
    const totalMembers = servers.reduce((a, s) => a + s.memberCount, 0);
    let description = '';
    for (const cls of exports.SERVER_CLASSES) {
        const list = grouped.get(cls.name) ?? [];
        if (list.length === 0)
            continue;
        const range = cls.name === 'Cosmos'
            ? '10.000+'
            : `${cls.minMembers.toLocaleString('pt-BR')}+`;
        description += `\n**${cls.emoji} ${cls.name.toUpperCase()}** *(${range} membros)*\n`;
        for (const s of list) {
            const label = s.guildName ?? s.guildId;
            const link = s.inviteLink ? `[${label}](${s.inviteLink})` : `**${label}**`;
            description += `┣ ${link} — ${s.memberCount.toLocaleString('pt-BR')} membros\n`;
        }
    }
    if (!description.trim())
        description = '*Nenhum servidor cadastrado ainda.*';
    return new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.PRIMARY)
        .setTitle('🌌 Aliança Skyline — Servidores Oficiais')
        .setDescription(description)
        .addFields({
        name: '📊 Resumo',
        value: `**${servers.length}** servidor(es) • **${totalMembers.toLocaleString('pt-BR')}** membros totais`,
        inline: false,
    })
        .setThumbnail(client.user?.displayAvatarURL() ?? null)
        .setFooter({ text: '⚔️ Aliança Skyline — Unidos somos mais fortes' })
        .setTimestamp();
}
// ─── Atualiza classes de todos os servidores ──────────────────────────────────
async function updateAllServerClasses(client) {
    const servers = await client_1.prisma.allianceServer.findMany();
    let updated = 0, notFound = 0;
    for (const s of servers) {
        const guild = client.guilds.cache.get(s.guildId);
        if (!guild) {
            notFound++;
            continue;
        }
        const memberCount = guild.memberCount;
        const cls = getServerClass(memberCount);
        await client_1.prisma.allianceServer.update({
            where: { guildId: s.guildId },
            data: { memberCount, class: cls.name, guildName: guild.name },
        });
        updated++;
    }
    return { updated, notFound };
}
//# sourceMappingURL=alliance.js.map