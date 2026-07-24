import { Message, EmbedBuilder } from 'discord.js';
    import { COLORS } from '../utils/embeds';

    export default {
    name: 'ajuda',
    description: 'Lista os comandos de prefix disponíveis',
    async execute(message: Message, _args: string[]) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY ?? 0x5865F2)
        .setTitle('📖 Comandos — Aliança Skyline')
        .setDescription('Use o prefix **b** seguido de espaço e o comando.\nEx: `b ping`')
        .addFields(
          {
            name: '🤖 Comandos de Prefix (b)',
            value: [
              '`b ping`  — Latência do bot',
              '`b ajuda` — Esta lista de comandos',
              '`b info`  — Informações sobre o bot',
            ].join('\n'),
          },
          {
            name: '🧠 Bryan (I.A.)',
            value:
              'Mencione **Bryan** no início da mensagem para falar com a I.A.\n' +
              'Ex: `Bryan, como entrar na aliança?`',
          },
          {
            name: '⚡ Slash Commands',
            value: 'Digite `/` para ver todos os comandos slash disponíveis.',
          },
        )
        .setFooter({ text: '⚔️ Aliança Skyline' })
        .setTimestamp();
      await message.reply({ embeds: [embed] });
    },
    };
    