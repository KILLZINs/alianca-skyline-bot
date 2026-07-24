"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embeds_1 = require("../utils/embeds");
exports.default = {
    name: 'ajuda',
    description: 'Lista os comandos disponíveis via prefix',
    async execute(message, _args) {
        const extClient = message.client;
        // Coleta os nomes de todos os slash commands registrados
        const slashCmds = [...(extClient.commands?.keys() ?? [])].sort();
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.PRIMARY)
            .setTitle('📖 Comandos — Aliança Skyline')
            .setDescription('Use **b** + espaço + nome do comando.\n' +
            'Todos os slash commands também funcionam com prefix!\n' +
            'Ex: `b perfil`, `b servidor`, `b ping`')
            .addFields({
            name: '⚡ Slash Commands disponíveis via prefix',
            value: slashCmds.length
                ? slashCmds.map(n => `\`${n}\``).join('  ')
                : 'Nenhum comando registrado ainda.',
        }, {
            name: '🧠 Bryan (I.A.)',
            value: 'Comece a mensagem com **Bryan** para falar com a I.A.\n' +
                'Ex: `Bryan, como entrar na aliança?`',
        })
            .setFooter({ text: '⚔️ Aliança Skyline' })
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    },
};
//# sourceMappingURL=ajuda.js.map