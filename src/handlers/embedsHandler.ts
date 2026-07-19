// ═══════════════════════════════════════════════════════════════════════
// HANDLER: /embeds — customização total de embeds
// ═══════════════════════════════════════════════════════════════════════

import {
  ButtonInteraction, ModalSubmitInteraction,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import {
  EMBED_CATALOG, EMBED_CATEGORIES,
  getTemplate, setTemplateField, clearTemplate,
  hexToInt, intToHex,
} from '../utils/embedTemplates';
import { COLORS, baseEmbed, successEmbed, errorEmbed } from '../utils/embeds';
import { isBotManager } from '../utils/allowlist';

// ── Tipos dos campos configuráveis ────────────────────────────────────
const FIELD_META: Record<string, { label: string; emoji: string; placeholder: string; style: TextInputStyle; max: number }> = {
  title:       { label: 'Título',          emoji: '📌', placeholder: 'Título do embed (máx 256 chars)', style: TextInputStyle.Short,     max: 256  },
  description: { label: 'Descrição',       emoji: '📄', placeholder: 'Descrição / conteúdo principal...',  style: TextInputStyle.Paragraph, max: 4000 },
  color:       { label: 'Cor (hex)',        emoji: '🎨', placeholder: '#9B59B6 (hex 6 dígitos)',          style: TextInputStyle.Short,     max: 7    },
  thumbnailUrl:{ label: 'URL Thumbnail',   emoji: '🖼️', placeholder: 'https://...',                       style: TextInputStyle.Short,     max: 512  },
  imageUrl:    { label: 'URL Imagem',      emoji: '🖼️', placeholder: 'https://... (imagem grande)',       style: TextInputStyle.Short,     max: 512  },
  footerText:  { label: 'Texto do Rodapé', emoji: '📝', placeholder: '⚔️ Aliança Skyline',               style: TextInputStyle.Short,     max: 2048 },
  footerIcon:  { label: 'Ícone do Rodapé', emoji: '🔗', placeholder: 'https://... (ícone URL)',           style: TextInputStyle.Short,     max: 512  },
};
const ALL_FIELDS = Object.keys(FIELD_META) as Array<keyof typeof FIELD_META>;

// ══════════════════════════════════════════════════════════════════════
// BUILD PANELS
// ══════════════════════════════════════════════════════════════════════

export function buildEmbedsHome(): { embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] } {
  const embed = baseEmbed(COLORS.PRIMARY)
    .setTitle('⚙️ Customização de Embeds')
    .setDescription(
      'Personalize **título, descrição, cor, imagens e rodapé** de cada embed do bot.\n\n' +
      'Selecione uma categoria para começar:'
    )
    .addFields(
      { name: '🎯 Geral', value: 'Boas-vindas, Level Up, Roleplay, Painel', inline: true },
      { name: '⚔️ RPG',   value: 'Vitória, Derrota, Empate no combate',    inline: true },
      { name: '🌐 Aliança', value: 'Embed oficial da aliança',              inline: true },
    );

  const rows = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('embeds:cat|geral').setLabel('🎯 Geral').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('embeds:cat|rpg').setLabel('⚔️ RPG').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('embeds:cat|alianca').setLabel('🌐 Aliança').setStyle(ButtonStyle.Success),
    ),
  ];

  return { embed, rows };
}

function buildCategoryPanel(category: string): { embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] } {
  const catLabel = EMBED_CATEGORIES[category] ?? category;
  const entries  = Object.entries(EMBED_CATALOG).filter(([, v]) => v.category === category);

  const embed = baseEmbed(COLORS.INFO)
    .setTitle(`${catLabel} — Embeds configuráveis`)
    .setDescription('Selecione o embed que deseja personalizar:')
    .addFields(entries.map(([key, e]) => {
      const tpl = getTemplate(key);
      const hasConfig = tpl && Object.values(tpl).some(v => v !== null && v !== key);
      return { name: e.label + (hasConfig ? ' ✅' : ''), value: e.desc, inline: false };
    }));

  // Botões de embeds (Discord permite 5 por row, 5 rows = 25 max)
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < entries.length; i += 4) {
    const chunk = entries.slice(i, i + 4);
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        chunk.map(([key, e]) =>
          new ButtonBuilder()
            .setCustomId(`embeds:edit|${key}`)
            .setLabel(e.label.replace(/^[^\s]+\s/, '')) // remove emoji prefix for short label
            .setStyle(ButtonStyle.Secondary)
        )
      )
    );
  }

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('embeds:home').setLabel('◀ Voltar').setStyle(ButtonStyle.Secondary),
    )
  );

  return { embed, rows };
}

function buildEditPanel(key: string): { embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] } {
  const info = EMBED_CATALOG[key];
  const tpl  = getTemplate(key);

  const lines = ALL_FIELDS.map(f => {
    const meta = FIELD_META[f];
    let val: string;
    if (!tpl || tpl[f as keyof typeof tpl] === null || tpl[f as keyof typeof tpl] === undefined) {
      val = '**(padrão)**';
    } else {
      const raw = tpl[f as keyof typeof tpl] as string | number;
      val = f === 'color' ? intToHex(raw as number) : `\`${String(raw).slice(0, 60)}${String(raw).length > 60 ? '…' : ''}\``;
    }
    return `${meta.emoji} **${meta.label}:** ${val}`;
  });

  const embed = baseEmbed(COLORS.GOLD)
    .setTitle(`✏️ ${info?.label ?? key}`)
    .setDescription(`${info?.desc ?? ''}\n\n**Valores atuais:**\n${lines.join('\n')}`);

  // Row 1: title, description, color
  // Row 2: thumbnailUrl, imageUrl
  // Row 3: footerText, footerIcon
  // Row 4: clear, back
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`embeds:setfield|${key}|title`).setLabel('📌 Título').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`embeds:setfield|${key}|description`).setLabel('📄 Descrição').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`embeds:setfield|${key}|color`).setLabel('🎨 Cor').setStyle(ButtonStyle.Primary),
  );
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`embeds:setfield|${key}|thumbnailUrl`).setLabel('🖼️ Thumbnail').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`embeds:setfield|${key}|imageUrl`).setLabel('🖼️ Imagem').setStyle(ButtonStyle.Secondary),
  );
  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`embeds:setfield|${key}|footerText`).setLabel('📝 Rodapé').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`embeds:setfield|${key}|footerIcon`).setLabel('🔗 Ícone Rodapé').setStyle(ButtonStyle.Secondary),
  );
  const row4 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`embeds:clear|${key}`).setLabel('🗑️ Limpar Tudo').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`embeds:cat|${info?.category ?? 'geral'}`).setLabel('◀ Voltar').setStyle(ButtonStyle.Secondary),
  );

  return { embed, rows: [row1, row2, row3, row4] };
}


// ══════════════════════════════════════════════════════════════════════
// BUTTON HANDLER (usa interaction.update / showModal diretamente)
// ══════════════════════════════════════════════════════════════════════

export async function handleEmbedsButtonRaw(interaction: ButtonInteraction): Promise<void> {
  if (!await isBotManager(interaction.user.id)) {
    await interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
    return;
  }

  const [, rest] = interaction.customId.split(':');
  const [action, ...args] = rest.split('|');

  if (action === 'home') {
    const { embed, rows } = buildEmbedsHome();
    await interaction.update({ embeds: [embed], components: rows });
    return;
  }

  if (action === 'cat') {
    const { embed, rows } = buildCategoryPanel(args[0]);
    await interaction.update({ embeds: [embed], components: rows });
    return;
  }

  if (action === 'edit') {
    const key = args[0];
    const { embed, rows } = buildEditPanel(key);
    await interaction.update({ embeds: [embed], components: rows });
    return;
  }

  if (action === 'setfield') {
    const [key, field] = args;
    const meta = FIELD_META[field];
    if (!meta) {
      await interaction.reply({ content: '❌ Campo inválido.', ephemeral: true });
      return;
    }

    const tpl     = getTemplate(key);
    const current = tpl ? (tpl[field as keyof typeof tpl] as string | number | null) : null;
    const currentStr = current === null || current === undefined
      ? ''
      : field === 'color' ? intToHex(current as number) : String(current);

    const modal = new ModalBuilder()
      .setCustomId(`embeds_modal:${key}|${field}`)
      .setTitle(`${meta.emoji} ${meta.label} — ${EMBED_CATALOG[key]?.label ?? key}`);

    const input = new TextInputBuilder()
      .setCustomId('value')
      .setLabel(meta.label)
      .setStyle(meta.style)
      .setPlaceholder(meta.placeholder)
      .setMaxLength(meta.max)
      .setRequired(false);

    if (currentStr) input.setValue(currentStr);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await interaction.showModal(modal);
    return;
  }

  if (action === 'clear') {
    const key = args[0];
    await clearTemplate(key);
    const { embed, rows } = buildEditPanel(key);
    await interaction.update({ embeds: [embed], components: rows });
    return;
  }
}

// ══════════════════════════════════════════════════════════════════════
// MODAL HANDLER
// ══════════════════════════════════════════════════════════════════════

export async function handleEmbedsModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (!await isBotManager(interaction.user.id)) {
    await interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
    return;
  }

  // Parse: embeds_modal:<key>|<field>
  const [, rest] = interaction.customId.split(':');
  const [key, field] = rest.split('|');

  const rawValue = interaction.fields.getTextInputValue('value').trim();

  await interaction.deferUpdate();

  if (!rawValue) {
    // Campo vazio = limpar esse campo
    await setTemplateField(key, field as keyof Omit<EmbedTemplateData, 'key'>, null);
  } else if (field === 'color') {
    const colorInt = hexToInt(rawValue);
    if (colorInt === null) {
      await interaction.followUp({ content: '❌ Cor inválida. Use formato hex: `#RRGGBB` ou `RRGGBB`', ephemeral: true });
    } else {
      await setTemplateField(key, 'color', colorInt);
    }
  } else {
    await setTemplateField(key, field as keyof Omit<EmbedTemplateData, 'key'>, rawValue);
  }

  const { embed, rows } = buildEditPanel(key);
  await interaction.editReply({ embeds: [embed], components: rows });
}

// Re-export type for imports
import type { EmbedTemplateData } from '../utils/embedTemplates';
