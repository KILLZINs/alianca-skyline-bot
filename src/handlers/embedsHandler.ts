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
      { name: '🎯 Geral',        value: 'Boas-vindas, Level Up, Roleplay, Painel',       inline: true },
      { name: '⚔️ RPG',          value: 'Vitória, Derrota, Empate no combate',           inline: true },
      { name: '🐉 Boss Mundial',  value: 'Spawn, Derrota e Expiração do Boss Mundial',   inline: true },
      { name: '💍 Casamento',     value: 'Proposta, Casamento e Divórcio',               inline: true },
      { name: '📋 Missões',       value: 'Missão diária e semanal concluída',            inline: true },
      { name: '🌐 Aliança',       value: 'Embed oficial da aliança',                     inline: true },
    );

  const rows = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('embeds:cat|geral').setLabel('🎯 Geral').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('embeds:cat|rpg').setLabel('⚔️ RPG').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('embeds:cat|bossmundial').setLabel('🐉 Boss').setStyle(ButtonStyle.Danger),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('embeds:cat|casamento').setLabel('💍 Casamento').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('embeds:cat|missoes').setLabel('📋 Missões').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('embeds:cat|alianca').setLabel('🌐 Aliança').setStyle(ButtonStyle.Secondary),
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

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < entries.length; i += 4) {
    const chunk = entries.slice(i, i + 4);
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        chunk.map(([key, e]) =>
          new ButtonBuilder()
            .setCustomId(`embeds:edit|${key}`)
            .setLabel(e.label.replace(/^[^\s]+\s/, ''))
            .setStyle(ButtonStyle.Primary)
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

  const embed = baseEmbed(COLORS.WARNING)
    .setTitle(`✏️ Editar: ${info?.label ?? key}`)
    .setDescription(`Personalize os campos do embed **${info?.label ?? key}**.`)
    .addFields(
      ALL_FIELDS.map(field => {
        const meta  = FIELD_META[field];
        const value = tpl?.[field as keyof typeof tpl];
        const display = field === 'color' && value ? intToHex(value as number) : (value ?? '*(padrão)*');
        return { name: `${meta.emoji} ${meta.label}`, value: `${display}`, inline: true };
      })
    );

  const rows: ActionRowBuilder<ButtonBuilder>[] = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      ALL_FIELDS.slice(0, 4).map(field =>
        new ButtonBuilder()
          .setCustomId(`embeds:field|${key}|${field}`)
          .setLabel(`${FIELD_META[field].emoji} ${FIELD_META[field].label}`)
          .setStyle(ButtonStyle.Secondary)
      )
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      [
        ...ALL_FIELDS.slice(4).map(field =>
          new ButtonBuilder()
            .setCustomId(`embeds:field|${key}|${field}`)
            .setLabel(`${FIELD_META[field].emoji} ${FIELD_META[field].label}`)
            .setStyle(ButtonStyle.Secondary)
        ),
        new ButtonBuilder()
          .setCustomId(`embeds:reset|${key}`)
          .setLabel('🗑️ Resetar Tudo')
          .setStyle(ButtonStyle.Danger),
      ]
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`embeds:cat|${info?.category ?? 'geral'}`)
        .setLabel('◀ Voltar')
        .setStyle(ButtonStyle.Secondary),
    ),
  ];

  return { embed, rows };
}

// ══════════════════════════════════════════════════════════════════════
// BUTTON HANDLER (raw — já é chamado com o interaction completo)
// ══════════════════════════════════════════════════════════════════════

export async function handleEmbedsButtonRaw(i: ButtonInteraction): Promise<void> {
  if (!await isBotManager(i.user.id)) {
    await i.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas gerenciadores do bot podem usar.')], ephemeral: true });
    return;
  }

  const raw    = i.customId.replace(/^embeds:/, '');
  const [op, ...rest] = raw.split('|');

  try {
    switch (op) {

      case 'home': {
        await i.deferUpdate();
        const { embed, rows } = buildEmbedsHome();
        await i.editReply({ embeds: [embed], components: rows });
        break;
      }

      case 'cat': {
        await i.deferUpdate();
        const category = rest[0];
        const { embed, rows } = buildCategoryPanel(category);
        await i.editReply({ embeds: [embed], components: rows });
        break;
      }

      case 'edit': {
        await i.deferUpdate();
        const key = rest[0];
        if (!EMBED_CATALOG[key]) {
          await i.editReply({ embeds: [errorEmbed('Embed não encontrado', `Chave \`${key}\` inválida.`)] });
          return;
        }
        const { embed, rows } = buildEditPanel(key);
        await i.editReply({ embeds: [embed], components: rows });
        break;
      }

      case 'field': {
        // Abrir modal para editar campo específico
        const [key, field] = rest;
        if (!EMBED_CATALOG[key] || !FIELD_META[field]) {
          await i.reply({ embeds: [errorEmbed('Inválido', 'Campo ou embed inválido.')], ephemeral: true });
          return;
        }
        const meta = FIELD_META[field];
        const tpl  = getTemplate(key);
        const current = field === 'color' && tpl?.color ? intToHex(tpl.color) : (tpl?.[field as keyof typeof tpl] ?? '') as string;

        const modal = new ModalBuilder()
          .setCustomId(`embedcfg:field|${key}|${field}`)
          .setTitle(`${meta.emoji} Editar ${meta.label}`)
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('value')
                .setLabel(meta.label)
                .setStyle(meta.style)
                .setRequired(false)
                .setPlaceholder(meta.placeholder)
                .setMaxLength(meta.max)
                .setValue(current.toString().slice(0, meta.max))
            )
          );

        await i.showModal(modal);
        break;
      }

      case 'reset': {
        await i.deferUpdate();
        const key = rest[0];
        await clearTemplate(key);
        const { embed, rows } = buildEditPanel(key);
        await i.editReply({ embeds: [successEmbed('✅ Resetado', `Template \`${key}\` restaurado para o padrão.`), embed], components: rows });
        break;
      }

      default:
        await i.reply({ embeds: [errorEmbed('Ação desconhecida', `Operação \`${op}\` não reconhecida.`)], ephemeral: true });
    }
  } catch (err) {
    console.error('[EmbedsCfg Error]', err);
    const errEmbed = errorEmbed('Erro', 'Ocorreu um erro ao processar.');
    if (i.replied || i.deferred) await i.editReply({ embeds: [errEmbed] }).catch(() => null);
    else await i.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => null);
  }
}

// ══════════════════════════════════════════════════════════════════════
// MODAL HANDLER (para submissão dos campos)
// ══════════════════════════════════════════════════════════════════════

export async function handleEmbedCfgModal(i: ModalSubmitInteraction, raw: string): Promise<void> {
  if (!await isBotManager(i.user.id)) {
    await i.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas gerenciadores do bot podem usar.')], ephemeral: true });
    return;
  }

  const [op, ...rest] = raw.split('|');

  if (op === 'field') {
    await i.deferUpdate();
    const [key, field] = rest;
    const rawValue = i.fields.getTextInputValue('value').trim();

    if (!rawValue) {
      // Limpar campo
      await setTemplateField(key, field as any, null);
    } else if (field === 'color') {
      const colorInt = hexToInt(rawValue);
      if (colorInt === null) {
        await i.editReply({ embeds: [errorEmbed('Cor inválida', 'Use formato hex como `#9B59B6`.')] });
        return;
      }
      await setTemplateField(key, 'color', colorInt);
    } else {
      await setTemplateField(key, field as any, rawValue);
    }

    const { embed, rows } = buildEditPanel(key);
    await i.editReply({ embeds: [successEmbed('✅ Salvo', `Campo **${FIELD_META[field]?.label ?? field}** atualizado!`), embed], components: rows });
  }
}
