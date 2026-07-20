"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const helpers_1 = require("../utils/helpers");
const embeds_1 = require("../utils/embeds");
const client_1 = require("../database/client");
const alliance_1 = require("../utils/alliance");
const embedTemplates_1 = require("../utils/embedTemplates");
const logger_1 = require("../utils/logger");
function today() { return new Date().toISOString().slice(0, 10); }
exports.default = {
    name: 'guildMemberAdd',
    once: false,
    async execute(member) {
        const guildId = member.guild.id;
        // ─── Track join stat ──────────────────────────────────────────────────────
        await client_1.prisma.serverStat.upsert({
            where: { guildId_date: { guildId, date: today() } },
            update: { joins: { increment: 1 } },
            create: { guildId, date: today(), joins: 1 },
        }).catch(console.error);
        await (0, helpers_1.getOrCreateMember)(member.id, member.user.username).catch(console.error);
        // ─── Blacklist check — banir automaticamente se estiver na blacklist ───────
        const blacklisted = await client_1.prisma.allianceBlacklist.findUnique({ where: { userId: member.id } }).catch(() => null);
        if (blacklisted) {
            await member.ban({ reason: `[Blacklist Aliança] ${blacklisted.reason ?? 'Sem motivo'}` }).catch(console.error);
            return; // Não continuar com boas-vindas
        }
        const config = await (0, helpers_1.getConfig)(guildId);
        // ─── Log de entrada ───────────────────────────────────────────────────────
        (0, logger_1.sendLog)(member.guild, logger_1.LOG.MEMBERS, (0, logger_1.logMemberJoin)(member)).catch(() => null);
        // ─── Auto-role ─────────────────────────────────────────────────────────────
        const roleToAssign = config.autoRoleId ?? config.memberRoleId ?? process.env.MEMBER_ROLE_ID;
        if (roleToAssign) {
            const role = member.guild.roles.cache.get(roleToAssign);
            if (role)
                await member.roles.add(role).catch(console.error);
        }
        // ─── Welcome message no canal ─────────────────────────────────────────────
        const welcomeChannelId = config.welcomeChannelId ?? process.env.WELCOME_CHANNEL_ID;
        if (welcomeChannelId) {
            const channel = member.guild.channels.cache.get(welcomeChannelId);
            if (channel) {
                const customMsg = config.welcomeMessage
                    ?.replace(/{user}/g, `${member}`)
                    .replace(/{username}/g, member.user.username)
                    .replace(/{server}/g, member.guild.name)
                    .replace(/{count}/g, `${member.guild.memberCount}`);
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(embeds_1.COLORS.PRIMARY)
                    .setTitle(`${embeds_1.EMOJIS.SPARKLES} Bem-vindo(a) à ${member.guild.name}!`)
                    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                    .setDescription(customMsg ??
                    `Olá, ${member}! Estamos felizes em ter você conosco. 💜\n\n` +
                        `${embeds_1.EMOJIS.SHIELD} **${member.guild.name}** — Unidos somos mais fortes.\n\n` +
                        `Use \`/painel\` para ver tudo que o bot oferece!`)
                    .addFields({ name: '👥 Membro nº', value: `**#${member.guild.memberCount}**`, inline: true }, { name: '📅 Conta criada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true })
                    .setFooter({ text: `⚔️ ${member.guild.name}` })
                    .setTimestamp();
                (0, embedTemplates_1.applyTemplate)(embed, 'welcome.channel');
                await channel.send({ content: `👋 Boas-vindas, ${member}!`, embeds: [embed] }).catch(console.error);
            }
        }
        // ─── DM com embed oficial da aliança (obrigatório para servidores da aliança) ──
        const inAlliance = await (0, alliance_1.isAllianceServer)(guildId).catch(() => false);
        if (!inAlliance)
            return;
        try {
            const allianceEmbed = await (0, alliance_1.buildOfficialAllianceEmbed)(member.client);
            const dmEmbed = new discord_js_1.EmbedBuilder()
                .setColor(embeds_1.COLORS.PRIMARY)
                .setTitle(`🌌 Bem-vindo(a) à Aliança Skyline!`)
                .setDescription(`Olá, **${member.user.username}**! Você acaba de entrar em **${member.guild.name}**,\n` +
                `um servidor membro oficial da **Aliança Skyline**! 💜\n\n` +
                `Aqui estão todos os servidores da nossa aliança — sinta-se à vontade para conhecer cada um deles:`)
                .setThumbnail(member.client.user?.displayAvatarURL() ?? null)
                .setFooter({ text: '⚔️ Aliança Skyline — Unidos somos mais fortes' })
                .setTimestamp();
            await member.user.send({ embeds: [dmEmbed, allianceEmbed] }).catch(() => null); // DMs podem estar fechadas
        }
        catch { /* silently ignore DM errors */ }
    },
};
//# sourceMappingURL=guildMemberAdd.js.map