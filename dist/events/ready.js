"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("../database/client");
const embeds_1 = require("../utils/embeds");
const allowlist_1 = require("../utils/allowlist");
const botConfig_1 = require("../utils/botConfig");
const embedTemplates_1 = require("../utils/embedTemplates");
exports.default = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ Bot online como ${client.user?.tag}`);
        // ─── Carregar allowlist + configs ─────────────────────────────────────────
        await Promise.all([(0, allowlist_1.loadAllowlist)(), (0, botConfig_1.loadBotConfig)(), (0, embedTemplates_1.loadEmbedTemplates)()]);
        console.log(`[botConfig] Configuração de embeds carregada.`);
        // Refresh CDN URLs (expiram em ~24h)
        await (0, embedTemplates_1.refreshImageUrls)(process.env.DISCORD_TOKEN ?? "").catch(console.error);
        setInterval(() => (0, embedTemplates_1.refreshImageUrls)(process.env.DISCORD_TOKEN ?? "").catch(console.error), 12 * 60 * 60 * 1000);
        console.log(`[allowlist] Cache carregado. Enforcement: ${(0, allowlist_1.isEnforcementActive)() ? 'ATIVO' : 'inativo (lista vazia)'}`);
        // ─── Sair de servidores não autorizados ───────────────────────────────────
        if ((0, allowlist_1.isEnforcementActive)()) {
            for (const [, guild] of client.guilds.cache) {
                if (!(0, allowlist_1.isGuildAllowed)(guild.id)) {
                    console.log(`[allowlist] Saindo de servidor não autorizado na inicialização: ${guild.name} (${guild.id})`);
                    const notifyEmbed = new discord_js_1.EmbedBuilder()
                        .setColor(embeds_1.COLORS.WARNING)
                        .setTitle(`${embeds_1.EMOJIS.WARNING} Servidor Removido da Allowlist`)
                        .setDescription(`O bot foi removido automaticamente do servidor **${guild.name}** (\`${guild.id}\`) por não estar na allowlist.\n\n` +
                        `Para reautorizar: \`/botadmin servidor adicionar guild_id:${guild.id}\``)
                        .setTimestamp();
                    for (const ownerId of (0, allowlist_1.getOwnerIds)()) {
                        try {
                            const user = await client.users.fetch(ownerId);
                            await user.send({ embeds: [notifyEmbed] });
                        }
                        catch { /* DMs fechadas */ }
                    }
                    await guild.leave().catch(console.error);
                }
            }
        }
        // ─── Presença do bot ──────────────────────────────────────────────────────
        const activities = [
            { name: 'Aliança Skyline ⚔️', type: discord_js_1.ActivityType.Watching },
            { name: 'com os membros da aliança', type: discord_js_1.ActivityType.Playing },
            { name: '/painel para começar', type: discord_js_1.ActivityType.Listening },
            { name: '🐉 Boss Mundial ativo!', type: discord_js_1.ActivityType.Competing },
        ];
        let activityIdx = 0;
        client.user?.setPresence({ activities: [activities[0]], status: 'online' });
        setInterval(() => {
            activityIdx = (activityIdx + 1) % activities.length;
            client.user?.setPresence({ activities: [activities[activityIdx]], status: 'online' });
        }, 30000);
        // ─── Cron: Sorteios (a cada minuto) ──────────────────────────────────────
        node_cron_1.default.schedule('* * * * *', async () => {
            const ended = await client_1.prisma.giveaway.findMany({
                where: { ended: false, endsAt: { lte: new Date() } },
                include: { entries: { include: { member: true } } },
            });
            for (const giveaway of ended) {
                const guild = client.guilds.cache.get(giveaway.guildId);
                if (!guild)
                    continue;
                const channel = guild.channels.cache.get(giveaway.channelId);
                if (!channel)
                    continue;
                const entries = giveaway.entries;
                const numWinners = Math.min(giveaway.winners, entries.length);
                const winnerIds = [];
                const shuffled = [...entries].sort(() => Math.random() - 0.5);
                for (let w = 0; w < numWinners; w++)
                    winnerIds.push(shuffled[w].member.discordId);
                await client_1.prisma.giveaway.update({ where: { id: giveaway.id }, data: { ended: true, winnerIds } });
                const mentionList = winnerIds.length ? winnerIds.map(id => `<@${id}>`).join(', ') : 'Nenhum participante 😔';
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(embeds_1.COLORS.GOLD)
                    .setTitle(`${embeds_1.EMOJIS.GIFT} Sorteio Encerrado!`)
                    .setDescription(`**Prêmio:** ${giveaway.prize}\n\n🎊 **Vencedor(es):** ${mentionList}`)
                    .setFooter({ text: '⚔️ Aliança Skyline' })
                    .setTimestamp();
                if (giveaway.messageId) {
                    try {
                        const msg = await channel.messages.fetch(giveaway.messageId);
                        await msg.edit({ embeds: [embed], components: [] });
                    }
                    catch { /* message may be deleted */ }
                }
                await channel.send({
                    content: winnerIds.length ? `🎊 Parabéns ${mentionList}! Você ganhou **${giveaway.prize}**!` : '😔 Nenhum participante no sorteio.',
                    embeds: [embed],
                });
            }
        });
        // ─── Cron: Expirar bosses mundiais e propostas (a cada 15 minutos) ────────
        node_cron_1.default.schedule('*/15 * * * *', async () => {
            try {
                const { expireOldBosses } = await Promise.resolve().then(() => __importStar(require('../rpg/services/worldBoss')));
                const { expireOldProposals } = await Promise.resolve().then(() => __importStar(require('../rpg/services/marriage')));
                await Promise.all([expireOldBosses(), expireOldProposals()]);
            }
            catch (err) {
                console.error('[Cron] Erro ao expirar bosses/propostas:', err);
            }
        });
        // ─── Cron: Notificar boss expirado em anúncios (a cada hora) ─────────────
        node_cron_1.default.schedule('0 * * * *', async () => {
            try {
                // Verificar bosses que expiraram na última hora e ainda não notificados
                const expiredBosses = await client_1.prisma.worldBoss.findMany({
                    where: {
                        status: 'expired',
                        expiresAt: { gte: new Date(Date.now() - 3600000), lte: new Date() },
                    },
                });
                for (const boss of expiredBosses) {
                    const guild = client.guilds.cache.get(boss.guildId);
                    if (!guild)
                        continue;
                    // Tentar encontrar um canal de anúncio
                    const config = await client_1.prisma.guildConfig.findUnique({ where: { guildId: boss.guildId } });
                    const channelId = config?.announcementChannelId ?? config?.welcomeChannelId;
                    if (!channelId)
                        continue;
                    const channel = guild.channels.cache.get(channelId);
                    if (!channel)
                        continue;
                    const embed = new discord_js_1.EmbedBuilder()
                        .setColor(0x636E72)
                        .setTitle(`💨 ${boss.emoji} Boss Mundial Escapou!`)
                        .setDescription(`**${boss.name}** [Nv.${boss.level}] não foi derrotado a tempo e escapou!\n\n` +
                        `HP restante: **${boss.currentHp.toLocaleString('pt-BR')}/${boss.maxHp.toLocaleString('pt-BR')}**\n\n` +
                        `*O boss irá retornar mais forte em breve...*`)
                        .setTimestamp();
                    await channel.send({ embeds: [embed] }).catch(() => null);
                }
            }
            catch (err) {
                console.error('[Cron] Erro ao notificar boss expirado:', err);
            }
        });
        // ─── Cron: Resetar missões semanais (toda segunda às 00:00) ──────────────
        node_cron_1.default.schedule('0 0 * * 1', async () => {
            try {
                console.log('[Cron] Resetando missões semanais...');
                // As missões semanais são filtradas por weekStr, então são recriadas
                // automaticamente na semana seguinte. Apenas limpar registros muito antigos.
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                // Calcular weekStr de 2 semanas atrás
                const jan1 = new Date(twoWeeksAgo.getFullYear(), 0, 1);
                const oldWeek = Math.ceil(((twoWeeksAgo.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
                const oldWeekStr = `${twoWeeksAgo.getFullYear()}-W${oldWeek.toString().padStart(2, '0')}`;
                await client_1.prisma.weeklyMission.deleteMany({
                    where: { weekStr: { lte: oldWeekStr } },
                });
                console.log('[Cron] Missões semanais antigas removidas.');
            }
            catch (err) {
                console.error('[Cron] Erro ao resetar missões semanais:', err);
            }
        });
        // ─── Cron: Eventos de mundo aleatórios (a cada 3-6h, horários ímpares) ─────
        // Tenta iniciar um evento aleatório às 1h, 7h, 13h, 19h (±aleatorio)
        node_cron_1.default.schedule('0 1,7,13,19 * * *', async () => {
            // Só dispara com 40% de chance para variar o horário
            if (Math.random() > 0.4)
                return;
            try {
                const { startRandomWorldEvent } = await Promise.resolve().then(() => __importStar(require('../rpg/panels/world-events')));
                let started = 0;
                for (const [, guild] of client.guilds.cache) {
                    const result = await startRandomWorldEvent(guild.id).catch(() => ({ success: false }));
                    if (result.success && result.name) {
                        started++;
                        // Tenta anunciar o evento no canal de anúncios configurado
                        const { prisma: db } = await Promise.resolve().then(() => __importStar(require('../database/client')));
                        const config = await db.guildConfig.findUnique({ where: { guildId: guild.id } }).catch(() => null);
                        const channelId = config?.announcementChannelId ?? config?.welcomeChannelId;
                        if (channelId) {
                            const { TextChannel, EmbedBuilder: EB } = await Promise.resolve().then(() => __importStar(require('discord.js')));
                            const ch = guild.channels.cache.get(channelId);
                            if (ch && ch.isTextBased()) {
                                const em = new EB()
                                    .setColor(0xFFD700)
                                    .setTitle(`🌎 Evento de Mundo Iniciado!`)
                                    .setDescription(`Um evento especial começou: **${result.name}**\n\nAbra seu perfil RPG e vá em 🌎 Eventos para participar!`)
                                    .setTimestamp();
                                await ch.send({ embeds: [em] }).catch(() => null);
                            }
                        }
                    }
                }
                if (started > 0)
                    console.log(`[Cron] Eventos aleatórios iniciados em ${started} servidor(es).`);
            }
            catch (err) {
                console.error('[Cron] Erro no scheduler de eventos:', err);
            }
        });
        console.log(`📋 ${client.guilds.cache.size} servidor(es) | 👥 ${client.users.cache.size} usuário(s)`);
    },
};
//# sourceMappingURL=ready.js.map