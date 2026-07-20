"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOwner = isOwner;
exports.isAdmin = isAdmin;
exports.isModerator = isModerator;
exports.checkAdmin = checkAdmin;
exports.checkModerator = checkModerator;
const types_1 = require("../types");
const helpers_1 = require("./helpers");
const embeds_1 = require("./embeds");
function isOwner(userId) {
    if (userId === types_1.OWNER_ID)
        return true;
    // Suporta múltiplos donos via BOT_OWNER_IDS (csv) além do legado OWNER_ID
    const extra = (process.env.BOT_OWNER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    return extra.includes(userId);
}
async function isAdmin(member, guildId) {
    if (isOwner(member.id))
        return true;
    if (member.permissions.has('Administrator'))
        return true;
    const config = await (0, helpers_1.getConfig)(guildId);
    if (config.adminRoleId && member.roles.cache.has(config.adminRoleId))
        return true;
    return false;
}
async function isModerator(member, guildId) {
    if (await isAdmin(member, guildId))
        return true;
    const config = await (0, helpers_1.getConfig)(guildId);
    if (config.modRoleId && member.roles.cache.has(config.modRoleId))
        return true;
    return false;
}
async function checkAdmin(interaction) {
    if (!interaction.guild || !interaction.member) {
        // BUG FIX: verificar se interação já foi respondida antes de chamar reply
        const errMsg = { embeds: [(0, embeds_1.errorEmbed)('Erro', 'Este comando só pode ser usado em servidores.')], ephemeral: true };
        if (interaction.replied || interaction.deferred)
            await interaction.followUp(errMsg).catch(() => null);
        else
            await interaction.reply(errMsg).catch(() => null);
        return false;
    }
    const member = interaction.member;
    if (!(await isAdmin(member, interaction.guild.id))) {
        const errMsg = { embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Você precisa ser administrador para usar isso.')], ephemeral: true };
        if (interaction.replied || interaction.deferred)
            await interaction.followUp(errMsg).catch(() => null);
        else
            await interaction.reply(errMsg).catch(() => null);
        return false;
    }
    return true;
}
async function checkModerator(interaction) {
    if (!interaction.guild || !interaction.member) {
        const errMsg = { embeds: [(0, embeds_1.errorEmbed)('Erro', 'Este comando só pode ser usado em servidores.')], ephemeral: true };
        if (interaction.replied || interaction.deferred)
            await interaction.followUp(errMsg).catch(() => null);
        else
            await interaction.reply(errMsg).catch(() => null);
        return false;
    }
    const member = interaction.member;
    if (!(await isModerator(member, interaction.guild.id))) {
        const errMsg = { embeds: [(0, embeds_1.errorEmbed)('Sem Permissão', 'Você precisa ser moderador para usar isso.')], ephemeral: true };
        if (interaction.replied || interaction.deferred)
            await interaction.followUp(errMsg).catch(() => null);
        else
            await interaction.reply(errMsg).catch(() => null);
        return false;
    }
    return true;
}
//# sourceMappingURL=permissions.js.map