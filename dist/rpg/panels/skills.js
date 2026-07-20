"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHabilidadesEmbed = buildHabilidadesEmbed;
exports.buildHabilidadesButtons = buildHabilidadesButtons;
const discord_js_1 = require("discord.js");
const skills_1 = require("../constants/skills");
const classes_1 = require("../constants/classes");
function buildHabilidadesEmbed(char) {
    const cls = (0, classes_1.getClass)(char.class);
    const availableSkills = cls?.divineSkills.map(id => skills_1.DIVINE_SKILLS[id]).filter(Boolean) ?? [];
    let currentSkillText = '*Nenhuma habilidade divina equipada.*';
    if (char.divineSkillId) {
        const ds = skills_1.DIVINE_SKILLS[char.divineSkillId];
        if (ds) {
            const next = (0, skills_1.nextSkillRank)(char.divineSkillRank);
            currentSkillText = [
                `${ds.emoji} **${ds.name}** [Rank **${char.divineSkillRank}**]`,
                `> ${ds.description}`,
                `> Tipo: \`${ds.type}\` | Custo: \`${ds.energyCost} Energia\``,
                next ? `> XP para Rank ${next}: **${char.divineSkillExp}/${ds.rankUpExpRequired}**` : '> **RANK MÁXIMO SSS** 🌟',
            ].join('\n');
        }
    }
    const skillListText = availableSkills.length > 0
        ? availableSkills.map(s => {
            const isActive = char.divineSkillId === s.id;
            const learned = char.divineSkillId === s.id;
            return `${isActive ? '✅' : '○'} ${s.emoji} **${s.name}** — Lv.${s.unlockLevel}+\n> ${s.description}`;
        }).join('\n\n')
        : '*Nenhuma habilidade disponível para sua classe.*';
    // Dica de dano estimado da habilidade equipada
    let dmgHint = '';
    if (char.divineSkillId) {
        const ds = skills_1.DIVINE_SKILLS[char.divineSkillId];
        if (ds && ds.type === 'ataque') {
            const eff = (0, skills_1.skillEffectValue)(ds, char.divineSkillRank);
            dmgHint = `\n> 📐 Multiplicador de dano atual: **×${eff.toFixed(2)}**`;
        }
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xF1C40F)
        .setTitle('✨ Habilidades Divinas')
        .setDescription(`Habilidades divinas são poderes únicos da sua classe que evoluem com o uso em combate.\n` +
        `Sua classe: **${cls?.name ?? char.class}** ${cls?.emoji ?? ''}`)
        .addFields({ name: '⚡ Habilidade Equipada', value: currentSkillText + dmgHint, inline: false }, { name: `📚 Habilidades Disponíveis — ${cls?.name ?? 'sua classe'}`, value: skillListText, inline: false }, { name: '🔑 Pontos de Skill', value: `**${char.skillPoints}**`, inline: true }, { name: '📊 Nível Atual', value: `**${char.level}**`, inline: true }, { name: '📖 Como funciona', value: 'Ranks: F → E → D → C → B → A → S → SS → **SSS**\nO rank sobe com o uso em combate.', inline: false })
        .setFooter({ text: 'Selecione uma habilidade abaixo para equipá-la.' });
    // select para equipar habilidade
    const unlocked = availableSkills.filter(s => char.level >= s.unlockLevel);
    const select = unlocked.length > 0
        ? new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('rpg_select:equipar_skill')
            .setPlaceholder('Selecione uma habilidade para equipar...')
            .addOptions(unlocked.map(s => new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel(`${s.name} [${s.type}]`)
            .setValue(s.id)
            .setEmoji(s.emoji.trim())
            .setDescription(`Lv.${s.unlockLevel}+ | Custo: ${s.energyCost} energia`)
            .setDefault(char.divineSkillId === s.id))))
        : null;
    return { embed, select };
}
function buildHabilidadesButtons(char) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('rpg:habilidades').setLabel('🔄 Atualizar').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:perfil').setLabel('◀ Perfil').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('rpg:cidade').setLabel('🏰 Cidade').setStyle(discord_js_1.ButtonStyle.Primary));
}
//# sourceMappingURL=skills.js.map