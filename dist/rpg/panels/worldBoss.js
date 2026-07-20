"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DO BOSS MUNDIAL
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWorldBossEmbed = buildWorldBossEmbed;
exports.buildWorldBossButtons = buildWorldBossButtons;
exports.buildWorldBossSpawnSelect = buildWorldBossSpawnSelect;
exports.buildWorldBossLevelSelect = buildWorldBossLevelSelect;
const discord_js_1 = require("discord.js");
const worldBoss_1 = require("../services/worldBoss");
// ─── Embed do boss ─────────────────────────────────────────────────────
async function buildWorldBossEmbed(guildId) {
    const boss = await (0, worldBoss_1.getActiveBoss)(guildId);
    if (!boss) {
        return new discord_js_1.EmbedBuilder()
            .setColor(0x2C3E50)
            .setTitle('🌍 Boss Mundial')
            .setDescription('**Nenhum Boss Mundial ativo no momento.**\n\n' +
            'O Boss Mundial é um inimigo épico que toda a guilda enfrenta juntos! ' +
            'O dano é compartilhado e as recompensas são distribuídas baseadas na contribuição.\n\n' +
            '*Aguarde um administrador invocar o próximo Boss Mundial.*')
            .setFooter({ text: '⚔️ Aliança Skyline RPG — Boss Mundial' });
    }
    const hpPct = Math.max(0, (boss.currentHp / boss.maxHp) * 100).toFixed(1);
    const color = boss.currentHp > boss.maxHp * 0.6 ? 0xE74C3C :
        boss.currentHp > boss.maxHp * 0.3 ? 0xF39C12 : 0x8E44AD;
    const topLines = boss.participants.slice(0, 5).map((p, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const contrib = boss.maxHp > 0 ? ((p.damageDealt / boss.maxHp) * 100).toFixed(1) : '0.0';
        return `${medal} **${p.username}** — ${p.damageDealt.toLocaleString('pt-BR')} dmg (${contrib}%)`;
    }).join('\n') || '*Nenhum herói ainda. Seja o primeiro a atacar!*';
    const expiresIn = boss.expiresAt.getTime() - Date.now();
    const hoursLeft = Math.max(0, Math.floor(expiresIn / 3600000));
    const minutesLeft = Math.max(0, Math.floor((expiresIn % 3600000) / 60000));
    return new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(`${boss.emoji} Boss Mundial — ${boss.name} [Nv.${boss.level}]`)
        .setDescription(`*${boss.description ?? ''}*\n\n` +
        `❤️ **HP:** ${(0, worldBoss_1.bossHpBar)(boss.currentHp, boss.maxHp)}\n` +
        `📊 **${boss.currentHp.toLocaleString('pt-BR')} / ${boss.maxHp.toLocaleString('pt-BR')}** (${hpPct}%)\n\n` +
        `⚔️ **Habilidades:** ${boss.description ? '' : ''}\n` +
        `⏱️ **Expira em:** ${hoursLeft}h ${minutesLeft}m\n` +
        `👥 **Participantes:** ${boss.participants.length}`)
        .addFields({ name: '🏆 Top Heróis', value: topLines, inline: false }, { name: '⭐ Recompensas (Top Contribuidor)', value: `${boss.xpReward.toLocaleString('pt-BR')} XP | ${boss.goldReward.toLocaleString('pt-BR')} 💰`, inline: true }, { name: '⏰ Cooldown de Ataque', value: '5 minutos por herói', inline: true })
        .setFooter({ text: '⚔️ Ataque e contribua para a derrota do boss! Recompensas proporcionais ao dano.' });
}
// ─── Botões do boss ────────────────────────────────────────────────────
async function buildWorldBossButtons(guildId, isAdmin) {
    const boss = await (0, worldBoss_1.getActiveBoss)(guildId);
    const hasActiveBoss = !!boss && boss.currentHp > 0;
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:worldboss_atacar')
        .setLabel('⚔️ Atacar Boss!')
        .setStyle(discord_js_1.ButtonStyle.Danger)
        .setDisabled(!hasActiveBoss), new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:worldboss')
        .setLabel('🔄 Atualizar')
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:cidade')
        .setLabel('◀ Voltar')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    if (isAdmin) {
        row1.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('rpg:worldboss_spawn')
            .setLabel('⚡ Invocar Boss')
            .setStyle(discord_js_1.ButtonStyle.Success)
            .setDisabled(hasActiveBoss));
    }
    return [row1];
}
// ─── Modal de spawn ────────────────────────────────────────────────────
function buildWorldBossSpawnSelect() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:worldboss_template')
        .setPlaceholder('Escolha o Boss Mundial...')
        .addOptions(worldBoss_1.WORLD_BOSS_TEMPLATES.map((t, i) => new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel(t.name)
        .setValue(`${i}`)
        .setEmoji(t.emoji)
        .setDescription(`${t.abilities[0]} | HP base: ${(t.baseHp / 1000).toFixed(0)}k`))));
}
function buildWorldBossLevelSelect(templateIndex) {
    const levels = [1, 2, 3, 5, 7, 10];
    const hpMultipliers = { 1: '×1.0', 2: '×1.5', 3: '×2.0', 5: '×3.0', 7: '×4.0', 10: '×5.5' };
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`rpg_select:worldboss_level:${templateIndex}`)
        .setPlaceholder('Escolha a dificuldade...')
        .addOptions(levels.map(l => new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel(`Nível ${l}`)
        .setValue(`${l}`)
        .setDescription(`HP ${hpMultipliers[l]} do base | ${l <= 2 ? '🟢 Fácil' : l <= 5 ? '🟡 Médio' : l <= 7 ? '🟠 Difícil' : '🔴 Lendário'}`))));
}
//# sourceMappingURL=worldBoss.js.map