"use strict";
// ═══════════════════════════════════════════════════════════════════════
// PAINEL DE PERFIL RPG — replica a imagem fornecida
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProfileEmbedAsync = buildProfileEmbedAsync;
exports.buildProfileEmbed = buildProfileEmbed;
exports.buildProfileButtons = buildProfileButtons;
exports.buildCidadeEmbed = buildCidadeEmbed;
exports.buildCidadeButtons = buildCidadeButtons;
exports.buildCidadeButtons2 = buildCidadeButtons2;
exports.buildPontosEmbed = buildPontosEmbed;
exports.buildPontosSelect = buildPontosSelect;
const discord_js_1 = require("discord.js");
const character_1 = require("../services/character");
const classes_1 = require("../constants/classes");
const items_1 = require("../constants/items");
const locations_1 = require("../constants/locations");
const skills_1 = require("../constants/skills");
const marriage_1 = require("../services/marriage");
// ─── Embed de perfil principal ─────────────────────────────────────────────
async function buildProfileEmbedAsync(char, stats) {
    const cls = (0, classes_1.getClass)(char.class);
    const loc = (0, locations_1.getLocation)(char.currentLocation);
    const envLabel = locations_1.ENV_EMOJI[char.environment] ?? char.environment;
    const eq = char.equipment;
    // Habilidade divina
    let divineText = '*Nenhuma habilidade divina ainda*';
    if (char.divineSkillId) {
        const ds = skills_1.DIVINE_SKILLS[char.divineSkillId];
        if (ds) {
            divineText = `${ds.emoji} **${ds.name}** [Rank ${char.divineSkillRank}]\n*${ds.description}*`;
        }
    }
    // Casamento
    const marriage = await (0, marriage_1.getMarriage)(char.discordId);
    let marriageText = '💔 *Solteiro(a)*';
    if (marriage) {
        const partnerId = (0, marriage_1.getPartner)(marriage, char.discordId);
        const daysTogether = Math.floor((Date.now() - marriage.marriedAt.getTime()) / 86400000);
        marriageText = `💍 <@${partnerId}> — ${daysTogether} dia(s) juntos`;
    }
    // Slots de equipamento (visual)
    const slotDisplay = (itemId, slotName) => {
        if (!itemId)
            return `\`${slotName.padEnd(7)}\` ──`;
        const item = (0, items_1.getItem)(itemId);
        return `\`${slotName.padEnd(7)}\` ${item?.emoji ?? '❓'} ${item?.name ?? itemId}`;
    };
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(cls?.color ?? 0x5865F2)
        .setTitle(`${cls?.emoji ?? '⚔️'} ${char.username} — Nível ${char.level} ${cls?.name ?? char.class}`)
        .setDescription([
        `> "*${cls?.name ?? char.class}*" • Karma: **${(0, classes_1.karmaLabel)(char.karma)}** • GEN. ${char.generation}`,
        '',
        `${xpBarDisplay(char)} **${char.xp}/${(0, classes_1.rpgXpForLevel)(char.level)} XP** (${Math.round(char.xp / (0, classes_1.rpgXpForLevel)(char.level) * 100)}%)`,
        `❤️ HP:     ${(0, character_1.hpBar)(char.currentHp, stats.maxHp)}  **${char.currentHp}/${stats.maxHp}**`,
        `⚡ Energia: ${(0, character_1.hpBar)(char.currentEnergy, stats.maxEnergy)}  **${char.currentEnergy}/${stats.maxEnergy}**`,
    ].join('\n'))
        .addFields({
        name: '📍 Localização',
        value: `${loc.emoji} **${loc.name}**\n${envLabel}`,
        inline: true,
    }, {
        name: '⚔️ Poder de Combate',
        value: `# ${stats.combatPower.toLocaleString('pt-BR')}`,
        inline: true,
    }, {
        name: '💰 Ouro',
        value: `**${char.gold.toLocaleString('pt-BR')}**`,
        inline: true,
    }, {
        name: '📊 Atributos de Combate',
        value: [
            `\`FOR\` **${stats.str}**   \`AGI\` **${stats.agi}**   \`INT\` **${stats.int}**   \`VIT\` **${stats.vit}**   \`SOR\` **${stats.lck}**`,
            ``,
            `⚔️ Ataque:  **${stats.attack}**     🛡️ Defesa: **${stats.defense}**`,
            `💥 Crítico: **${stats.critChance.toFixed(1)}%**   💨 Esquiva: **${stats.dodgeChance.toFixed(1)}%**`,
        ].join('\n'),
        inline: true,
    }, {
        name: '🎽 Equipamento Atual',
        value: eq ? [
            slotDisplay(eq.helmet, '⛑️ Elmo'),
            slotDisplay(eq.weapon, '⚔️ Arma'),
            slotDisplay(eq.shield, '🛡️ Escudo'),
            slotDisplay(eq.pants, '👖 Calças'),
            slotDisplay(eq.boots, '👟 Botas'),
            slotDisplay(eq.gloves, '🧤 Luvas'),
            slotDisplay(eq.ring, '💍 Anel'),
            slotDisplay(eq.backpack, '🎒 Mochila'),
            slotDisplay(eq.pet, '🐾 Pet'),
        ].join('\n') : '*Sem equipamento*',
        inline: true,
    }, {
        name: '✨ Habilidade Divina',
        value: divineText,
        inline: false,
    }, {
        name: '💍 Relacionamento',
        value: marriageText,
        inline: true,
    }, {
        name: '📈 Histórico de Batalhas',
        value: [
            `🏆 Vitórias: **${char.totalWins}**   💀 Mortes: **${char.totalDeaths}**`,
            `⚔️ PvP: **${char.pvpWins}W/${char.pvpLosses}L**   👹 Bosses: **${char.bossKills}**`,
        ].join('\n'),
        inline: true,
    })
        .setFooter({ text: `⚔️ Aliança Skyline RPG • Desde: ${char.createdAt.toISOString().slice(0, 10)}` })
        .setTimestamp();
    return embed;
}
// Versão síncrona mantida para compatibilidade (sem casamento)
function buildProfileEmbed(char, stats) {
    const cls = (0, classes_1.getClass)(char.class);
    const loc = (0, locations_1.getLocation)(char.currentLocation);
    const envLabel = locations_1.ENV_EMOJI[char.environment] ?? char.environment;
    const eq = char.equipment;
    let divineText = '*Nenhuma habilidade divina ainda*';
    if (char.divineSkillId) {
        const ds = skills_1.DIVINE_SKILLS[char.divineSkillId];
        if (ds)
            divineText = `${ds.emoji} **${ds.name}** [Rank ${char.divineSkillRank}]\n*${ds.description}*`;
    }
    const slotDisplay = (itemId, slotName) => {
        if (!itemId)
            return `\`${slotName.padEnd(7)}\` ──`;
        const item = (0, items_1.getItem)(itemId);
        return `\`${slotName.padEnd(7)}\` ${item?.emoji ?? '❓'} ${item?.name ?? itemId}`;
    };
    return new discord_js_1.EmbedBuilder()
        .setColor(cls?.color ?? 0x5865F2)
        .setTitle(`${cls?.emoji ?? '⚔️'} ${char.username} — Nível ${char.level} ${cls?.name ?? char.class}`)
        .setDescription([
        `> "*${cls?.name ?? char.class}*" • Karma: **${(0, classes_1.karmaLabel)(char.karma)}** • GEN. ${char.generation}`,
        '',
        `${xpBarDisplay(char)} **${char.xp}/${(0, classes_1.rpgXpForLevel)(char.level)} XP** (${Math.round(char.xp / (0, classes_1.rpgXpForLevel)(char.level) * 100)}%)`,
        `❤️ HP:     ${(0, character_1.hpBar)(char.currentHp, stats.maxHp)}  **${char.currentHp}/${stats.maxHp}**`,
        `⚡ Energia: ${(0, character_1.hpBar)(char.currentEnergy, stats.maxEnergy)}  **${char.currentEnergy}/${stats.maxEnergy}**`,
    ].join('\n'))
        .addFields({ name: '📍 Localização', value: `${loc.emoji} **${loc.name}**\n${envLabel}`, inline: true }, { name: '⚔️ Poder de Combate', value: `# ${stats.combatPower.toLocaleString('pt-BR')}`, inline: true }, { name: '💰 Ouro', value: `**${char.gold.toLocaleString('pt-BR')}**`, inline: true }, {
        name: '📊 Atributos de Combate',
        value: [
            `\`FOR\` **${stats.str}**   \`AGI\` **${stats.agi}**   \`INT\` **${stats.int}**   \`VIT\` **${stats.vit}**   \`SOR\` **${stats.lck}**`,
            `⚔️ Ataque:  **${stats.attack}**     🛡️ Defesa: **${stats.defense}**`,
            `💥 Crítico: **${stats.critChance.toFixed(1)}%**   💨 Esquiva: **${stats.dodgeChance.toFixed(1)}%**`,
        ].join('\n'),
        inline: true,
    }, {
        name: '🎽 Equipamento Atual',
        value: eq ? [
            slotDisplay(eq.helmet, '⛑️ Elmo'), slotDisplay(eq.weapon, '⚔️ Arma'),
            slotDisplay(eq.shield, '🛡️ Escudo'), slotDisplay(eq.pants, '👖 Calças'),
            slotDisplay(eq.boots, '👟 Botas'), slotDisplay(eq.gloves, '🧤 Luvas'),
            slotDisplay(eq.ring, '💍 Anel'), slotDisplay(eq.backpack, '🎒 Mochila'),
            slotDisplay(eq.pet, '🐾 Pet'),
        ].join('\n') : '*Sem equipamento*',
        inline: true,
    }, { name: '✨ Habilidade Divina', value: divineText, inline: false }, {
        name: '📈 Histórico de Batalhas',
        value: [
            `🏆 Vitórias: **${char.totalWins}**   💀 Mortes: **${char.totalDeaths}**`,
            `⚔️ PvP: **${char.pvpWins}W/${char.pvpLosses}L**   👹 Bosses: **${char.bossKills}**`,
        ].join('\n'),
        inline: false,
    })
        .setFooter({ text: `⚔️ Aliança Skyline RPG • Desde: ${char.createdAt.toISOString().slice(0, 10)}` })
        .setTimestamp();
}
// ─── Botões do perfil ──────────────────────────────────────────────────────────
function buildProfileButtons(char) {
    // Linha 1: ações principais (combate e exploração)
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon').setLabel('⚔️ Dungeon').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('rpg:viajar').setLabel('🗺️ Viajar').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('rpg:missoes').setLabel('📋 Missões').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:inventario').setLabel('🎒 Inventário').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary));
    // Linha 2: gerenciamento e acesso rápido
    const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏰 Cidade').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:habilidades').setLabel('✨ Habilidades').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:stats').setLabel('📊 Estatísticas').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:pontos')
        .setLabel(char.statPoints > 0 ? `⭐ Pontos (${char.statPoints}) ←` : '⭐ Pontos')
        .setStyle(char.statPoints > 0 ? discord_js_1.ButtonStyle.Danger : discord_js_1.ButtonStyle.Secondary)
        .setDisabled(char.statPoints === 0));
    // Linha 3: novos sistemas (meditação, treino, taverna, pesca, exploração)
    const isMeditating = !!char.meditatingUntil && new Date(char.meditatingUntil) > new Date();
    const meditaReady = !!char.meditatingUntil && new Date(char.meditatingUntil) <= new Date();
    const row3 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('rpg:meditar')
        .setLabel(meditaReady ? '🪷 Coletar' : isMeditating ? '🧘 Meditando...' : '🧘 Meditar')
        .setStyle(meditaReady ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:treinar').setLabel('🥊 Treinar').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:taverna').setLabel('🍺 Taverna').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:pescaria').setLabel('🎣 Pescar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:exploracao').setLabel('🌍 Explorar').setStyle(discord_js_1.ButtonStyle.Success));
    // Linha 4: missões de classe e eventos de mundo
    const row4 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:missoes_classe').setLabel('📜 Missões de Classe').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:eventos').setLabel('🌎 Eventos').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('rpg:dungeon_tipo').setLabel('⚔️ Dungeon+').setStyle(discord_js_1.ButtonStyle.Danger));
    return [row1, row2, row3, row4];
}
// ─── Embed da cidade (hub central) ────────────────────────────────────────────
function buildCidadeEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('🏰 Cidade da Aliança — Hub Central')
        .setDescription('O coração da Aliança Skyline. Prepare-se e embarque em novas aventuras.\n' +
        '> **Linha 1** dos botões: Loja · Curar · Forja · Missões · Boss\n' +
        '> **Linha 2** dos botões: Arena · Casar · Guilda · ◀ Voltar ao Perfil')
        .addFields({ name: '🛒 Loja', value: 'Equipamentos e consumíveis', inline: true }, { name: '🏥 Curar HP', value: 'Restaura HP e Energia (custa ouro)', inline: true }, { name: '⚒️ Forja', value: 'Crie itens com materiais raros', inline: true }, { name: '📋 Missões', value: 'Diárias e semanais com recompensa', inline: true }, { name: '🐉 Boss Mundial', value: 'Boss épico cooperativo da guilda', inline: true }, { name: '⚔️ Arena PvP', value: 'Desafie outros jogadores', inline: true }, { name: '💍 Casamento', value: 'Propor, aceitar ou divorciar', inline: true }, { name: '🏛️ Guilda', value: 'Crie ou gerencie sua guilda', inline: true })
        .setFooter({ text: '⚔️ Aliança Skyline RPG • Use os botões abaixo para navegar' });
}
function buildCidadeButtons() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:loja').setLabel('🛒 Loja').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:curandeiro').setLabel('🏥 Curar HP').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('rpg:forja').setLabel('⚒️ Forja').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:missoes').setLabel('📋 Missões').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:worldboss').setLabel('🐉 Boss').setStyle(discord_js_1.ButtonStyle.Danger));
}
function buildCidadeButtons2() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:arena').setLabel('⚔️ Arena PvP').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('rpg:casamento').setLabel('💍 Casar').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('rpg:guild').setLabel('🏛️ Guilda').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Perfil').setStyle(discord_js_1.ButtonStyle.Secondary));
}
// ─── Distribuir pontos de atributo ────────────────────────────────────────────
function buildPontosEmbed(char, stats) {
    return new discord_js_1.EmbedBuilder()
        .setColor(0xF1C40F)
        .setTitle('⭐ Distribuir Pontos de Atributo')
        .setDescription(`Você tem **${char.statPoints}** ponto(s) disponível(is) para distribuir.`)
        .addFields({ name: '💪 FOR (Força)', value: `${stats.str} → aumenta Ataque`, inline: true }, { name: '🏃 AGI (Agilidade)', value: `${stats.agi} → aumenta Esquiva e Crítico`, inline: true }, { name: '🧠 INT (Inteligência)', value: `${stats.int} → aumenta Magia`, inline: true }, { name: '❤️ VIT (Vitalidade)', value: `${stats.vit} → aumenta HP`, inline: true }, { name: '🍀 SOR (Sorte)', value: `${stats.lck} → aumenta Sorte/Ouro`, inline: true })
        .setFooter({ text: 'Selecione o atributo e a quantidade' });
}
function buildPontosSelect(statPoints) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('rpg_select:distribuir_stat')
        .setPlaceholder('Escolha o atributo para adicionar 1 ponto')
        .setDisabled(statPoints === 0)
        .addOptions(new discord_js_1.StringSelectMenuOptionBuilder().setLabel('💪 Força (FOR)').setValue('strength').setDescription('Aumenta ataque físico'), new discord_js_1.StringSelectMenuOptionBuilder().setLabel('🏃 Agilidade (AGI)').setValue('agility').setDescription('Aumenta esquiva e crítico'), new discord_js_1.StringSelectMenuOptionBuilder().setLabel('🧠 Inteligência (INT)').setValue('intelligence').setDescription('Aumenta poder mágico'), new discord_js_1.StringSelectMenuOptionBuilder().setLabel('❤️ Vitalidade (VIT)').setValue('vitality').setDescription('Aumenta HP máximo'), new discord_js_1.StringSelectMenuOptionBuilder().setLabel('🍀 Sorte (SOR)').setValue('luck').setDescription('Aumenta sorte e ouro')));
}
// ─── Helper barra de XP ───────────────────────────────────────────────────────
function xpBarDisplay(char) {
    const needed = (0, classes_1.rpgXpForLevel)(char.level);
    const pct = Math.min(1, char.xp / needed);
    const filled = Math.round(pct * 10);
    return '`' + '█'.repeat(filled) + '░'.repeat(10 - filled) + '`';
}
//# sourceMappingURL=profile.js.map