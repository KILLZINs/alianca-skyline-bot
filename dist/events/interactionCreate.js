"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
const buttonHandler_1 = require("../handlers/buttonHandler");
const selectHandler_1 = require("../handlers/selectHandler");
const modalHandler_1 = require("../handlers/modalHandler");
const allowlist_1 = require("../utils/allowlist");
exports.default = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        // ── Allowlist guard ──────────────────────────────────────────────────────
        // /botadmin sempre passa (dono precisa usá-lo mesmo de servidores não autorizados)
        const isBotAdmin = interaction.isChatInputCommand() && interaction.commandName === 'botadmin';
        if (interaction.guildId && !isBotAdmin && !(0, allowlist_1.isGuildAllowed)(interaction.guildId)) {
            if (interaction.isChatInputCommand()) {
                await interaction.reply({
                    embeds: [(0, embeds_1.errorEmbed)('Servidor Não Autorizado', 'Este servidor não está na allowlist do bot.\nContacte o dono do bot para solicitar acesso.')],
                    ephemeral: true,
                });
            }
            // Botões/modais/selects: silenciosamente ignorar
            return;
        }
        // ── Slash commands ───────────────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command)
                return;
            // Cooldown
            const { cooldowns } = client;
            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new discord_js_1.Collection());
            }
            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const cooldownMs = 3000;
            if (timestamps.has(interaction.user.id)) {
                const expiry = timestamps.get(interaction.user.id) + cooldownMs;
                if (now < expiry) {
                    const left = ((expiry - now) / 1000).toFixed(1);
                    await interaction.reply({
                        embeds: [(0, embeds_1.errorEmbed)('Aguarde!', `Espere **${left}s** antes de usar este comando novamente.`)],
                        ephemeral: true,
                    });
                    return;
                }
            }
            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownMs);
            try {
                await command.execute(interaction);
            }
            catch (err) {
                console.error(`Erro no comando ${interaction.commandName}:`, err);
                const embed = (0, embeds_1.errorEmbed)('Erro Inesperado', 'Ocorreu um erro ao executar este comando.');
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => null);
                }
                else {
                    await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => null);
                }
            }
            return;
        }
        // ── Buttons ──────────────────────────────────────────────────────────────
        if (interaction.isButton()) {
            await (0, buttonHandler_1.handleButton)(interaction);
            return;
        }
        // ── Select menus (string, role, channel, user) ───────────────────────────
        if (interaction.isAnySelectMenu()) {
            await (0, selectHandler_1.handleSelect)(interaction);
            return;
        }
        // ── Modals ───────────────────────────────────────────────────────────────
        if (interaction.isModalSubmit()) {
            await (0, modalHandler_1.handleModal)(interaction);
            return;
        }
    },
};
//# sourceMappingURL=interactionCreate.js.map