"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const allowlist_1 = require("../utils/allowlist");
const embeds_1 = require("../utils/embeds");
const discord_js_1 = require("discord.js");
exports.default = {
    name: 'guildCreate',
    once: false,
    async execute(guild) {
        const active = (0, allowlist_1.isEnforcementActive)();
        const allowed = (0, allowlist_1.isGuildAllowed)(guild.id);
        if (active && !allowed) {
            // ─── Deixar o servidor não autorizado ─────────────────────────────────
            console.log(`[allowlist] Saindo de servidor não autorizado: ${guild.name} (${guild.id})`);
            // DM para todos os donos/managers
            const ownerIds = (0, allowlist_1.getOwnerIds)();
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(embeds_1.COLORS.WARNING)
                .setTitle(`${embeds_1.EMOJIS.WARNING} Servidor Não Autorizado`)
                .setDescription(`O bot entrou em um servidor **não autorizado** e saiu automaticamente.\n\n` +
                `**Servidor:** ${guild.name}\n**ID:** \`${guild.id}\`\n**Membros:** ${guild.memberCount}\n\n` +
                `Para autorizar este servidor:\n\`\`\`/botadmin servidor adicionar guild_id:${guild.id}\`\`\``)
                .setThumbnail(guild.iconURL() ?? null)
                .setTimestamp();
            for (const ownerId of ownerIds) {
                try {
                    const user = await guild.client.users.fetch(ownerId);
                    await user.send({ embeds: [embed] });
                }
                catch { /* DMs fechadas */ }
            }
            await guild.leave().catch(console.error);
            return;
        }
        // ─── Servidor permitido (ou enforcement inativo) ───────────────────────
        const ownerIds = (0, allowlist_1.getOwnerIds)();
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.SUCCESS)
            .setTitle(`${embeds_1.EMOJIS.SPARKLES} Bot Entrou em Novo Servidor`)
            .setDescription(`**Servidor:** ${guild.name}\n**ID:** \`${guild.id}\`\n**Membros:** ${guild.memberCount}\n\n` +
            (!active
                ? `⚠️ **Modo bootstrap ativo** — a allowlist está vazia, então qualquer servidor pode usar o bot.\nUse \`/botadmin servidor adicionar\` para ativar o controle de acesso.`
                : `✅ Servidor já está na allowlist.`))
            .setThumbnail(guild.iconURL() ?? null)
            .setTimestamp();
        for (const ownerId of ownerIds) {
            try {
                const user = await guild.client.users.fetch(ownerId);
                await user.send({ embeds: [embed] });
            }
            catch { /* DMs fechadas */ }
        }
    },
};
//# sourceMappingURL=guildCreate.js.map