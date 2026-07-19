// ═══════════════════════════════════════════════════════════════════════
// SELF-ROLE — helpers compartilhados
// ═══════════════════════════════════════════════════════════════════════

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

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
      (menu.description ?? 'Clique nos botões abaixo para adicionar ou remover cargos.') +
      '\n\n*Clique novamente para remover um cargo já obtido.*'
    )
    .setFooter({ text: '⚔️ Aliança Skyline — Registro de Cargos' });

  const components: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < menu.entries.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      menu.entries.slice(i, i + 5).map(e => {
        const btn = new ButtonBuilder()
          .setCustomId(`selfrole:toggle:${e.roleId}`)
          .setLabel(e.label)
          .setStyle(ButtonStyle.Secondary);
        if (e.emoji) btn.setEmoji(e.emoji);
        return btn;
      })
    );
    components.push(row);
  }

  return { embeds: [embed], components };
}
