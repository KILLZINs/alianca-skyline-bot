// ═══════════════════════════════════════════════════════════════════════
// SELF-ROLE — helpers compartilhados
// ═══════════════════════════════════════════════════════════════════════

import {
  EmbedBuilder, ActionRowBuilder,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} from 'discord.js';

export type SelfRoleEntry = { roleId: string; label: string; emoji: string | null };
export type SelfRoleMenuData = {
  id: string; title: string; description: string | null;
  channelId: string; messageId: string | null;
  entries: SelfRoleEntry[];
};

export function buildMenuMessage(menu: SelfRoleMenuData) {
  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(menu.title)
    .setDescription(
      (menu.description ?? 'Use o menu abaixo para adicionar ou remover cargos do seu perfil.') +
      '\n\n*Ao selecionar um cargo já obtido, ele será removido.*'
    )
    .setFooter({ text: '⚔️ Aliança Skyline — Registro de Cargos' });

  const components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

  // Discord permite até 25 opções por select menu e até 5 ActionRows
  for (let i = 0; i < menu.entries.length; i += 25) {
    const chunk = menu.entries.slice(i, i + 25);
    const select = new StringSelectMenuBuilder()
      .setCustomId('selfrole:choose')
      .setPlaceholder('🎭 Selecione um cargo...')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        chunk.map(e =>
          new StringSelectMenuOptionBuilder()
            .setValue(e.roleId)
            .setLabel(e.label.slice(0, 100))
            .setDescription('Clique para adicionar ou remover este cargo')
            .setEmoji(e.emoji && /^\d{17,20}$/.test(e.emoji) ? { id: e.emoji } : e.emoji ? { name: e.emoji } : { name: '🏷️' })
        )
      );
    components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select));
  }

  return { embeds: [embed], components };
}
