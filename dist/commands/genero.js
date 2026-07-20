"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client_1 = require("../database/client");
const embeds_1 = require("../utils/embeds");
const GENEROS = {
    M: { label: 'Masculino', emoji: '♂️', pronoun: 'o' },
    F: { label: 'Feminino', emoji: '♀️', pronoun: 'a' },
    NB: { label: 'Não-binário', emoji: '⚧️', pronoun: '' },
};
exports.default = {
    category: 'geral',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('genero')
        .setDescription('Define ou vê o seu gênero (afeta mensagens e GIFs de roleplay)')
        .addStringOption(o => o.setName('genero')
        .setDescription('Seu gênero')
        .setRequired(false)
        .addChoices({ name: '♂️ Masculino', value: 'M' }, { name: '♀️ Feminino', value: 'F' }, { name: '⚧️ Não-binário', value: 'NB' })),
    async execute(interaction) {
        const novoGenero = interaction.options.getString('genero');
        if (!novoGenero) {
            // só mostrar o atual
            const m = await client_1.prisma.member.findUnique({ where: { discordId: interaction.user.id } });
            const genero = GENEROS[m?.gender ?? 'NB'] ?? GENEROS.NB;
            return interaction.reply({
                embeds: [
                    (0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO)
                        .setTitle('⚧️ Seu Gênero')
                        .setDescription(`Seu gênero atual é: **${genero.emoji} ${genero.label}**\n\nUse \`/genero genero:[opção]\` para alterar.`)
                ],
                ephemeral: true,
            });
        }
        await client_1.prisma.member.upsert({
            where: { discordId: interaction.user.id },
            update: { gender: novoGenero, username: interaction.user.username },
            create: { discordId: interaction.user.id, username: interaction.user.username, gender: novoGenero },
        });
        const g = GENEROS[novoGenero];
        return interaction.reply({
            embeds: [
                (0, embeds_1.successEmbed)('Gênero Definido!', `Seu gênero foi definido como **${g.emoji} ${g.label}**.\nAs mensagens de roleplay serão adaptadas.`)
            ],
            ephemeral: true,
        });
    },
};
//# sourceMappingURL=genero.js.map