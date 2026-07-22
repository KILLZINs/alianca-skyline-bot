// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HANDLER: /embeds — customização total de embeds
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

import {
  ButtonInteraction, ModalSubmitInteraction,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  Attachment, TextChannel, Message,
} from 'discord.js';
import {
  EMBED_CATALOG, EMBED_CATEGORIES,
  getTemplate, setTemplateField, clearTemplate,
  hexToInt, intToHex,
} from '../utils/embedTemplates';
import { COLORS, baseEmbed, successEmbed, errorEmbed } from '../utils/embeds';
import { isBotManager } from '../utils/allowlist';

// ──── Tipos dos campos configuráveis ────────────────────────────────────────────────────────────────────────────────────────
const FIELD_META: Record<string, { label: string; emoji: string; placeholder: string; style: TextInputStyle; max: number }> = {
  title:       { label: 'Título',          emoji: '📌', placeholder: 'Título do embed (máx 256 chars)', style: TextInputStyle.Short,     max: 256  },
  description: { label: 'Descrição',       emoji: '📄', placeholder: 'Descrição / conteúdo principal...',  style: TextInputStyle.Paragraph, max: 4000 },
  color:       { label: 'Cor (hex)',        emoji: '🎨', placeholder: '#9B59B6 (hex 6 dígitos)',          style: TextInputStyle.Short,     max: 7    },
  thumbnailUrl:{ label: 'Thumbnail',        emoji: '🖼️', placeholder: 'Envie uma imagem pelo botão',       style: TextInputStyle.Short,     max: 512  },
  imageUrl:    { label: 'Imagem',           emoji: '📸', placeholder: 'Envie uma imagem pelo botão',       style: TextInputStyle.Short,     max: 512  },
  footerText:  { label: 'Texto do Rodapé', emoji: '📝', placeholder: '⚔️ Aliança Skyline',               style: TextInputStyle.Short,     max: 2048 },
  footerIcon:  { label: 'Ícone do Rodapé', emoji: '🔗', placeholder: 'https://... (ícone URL)',           style: TextInputStyle.Short,     max: 512  },
};
const ALL_FIELDS = Object.keys(FIELD_META) as Array<keyof typeof FIELD_META>;

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// BUILD PANELS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export function buildEmbedsHome(): { embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] } {
  const embed = baseEmbed(COLORS.PRIMARY)
    .setTitle('⚙️ Customização de Embeds')
    .setDescription(
      'Personalize **título, descrição, cor, imagens e rodapé** de cada embed do bot.\n\n' +
      '📸 **Imagens:** Clique no botão de imagem e envie o arquivo diretamente no chat!\n\n' +
      'Selecione uma categoria para começar:'
    )
    .addFields(
      { name: '🎯 Geral',        value: 'Boas-vindas, Level Up, Roleplay, Painel',       inline: true },
      { name: '⚔️ RPG',          value: 'Vitória, Derrota, Empate, Level Up, Reencarnação', inline: true },
      { name: '🐉 Boss Mundial',  value: 'Spawn, Derrota e Expiração do Boss Mundial',   inline: true },
      { name: '💍 Casamento',     value: 'Proposta, Casamento e Divórcio',               inline: true },
      { name: '📋 Missões',       value: 'Missão diária e semanal concluída',            inline: true },
      { name: '🌐 Aliança',       value: 'Embed oficial da aliança',                     inline: true },
      { name: '🎫 Tickets',       value: 'Ticket criado, fechado e assumido',            inline: true },
      { name: '🎁 Sorteios',      value: 'Sorteio iniciado e anúncio de vencedor',       inline: true },
      { name: '🔨 Moderação',     value: 'Aviso, ban e kick aplicados',                  inline: true },
      { name: '🎭 Cargos',        value: 'Cargo adicionado e removido (self-role)',       inline: true },
    );

  const rows = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('embeds:cat|geral').setLabel('🎯 Geral').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('embeds:cat|rpg').setLabel('⚔️ RPG').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('embeds:cat|bossmundial').setLabel('🐉 Boss').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('embeds:cat|casamento').setLabel('💍 Casamento').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('embeds:cat|missoes').setLabel('📋 Missões').setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('embeds:cat|alianca').setLabel('🌐 Aliança').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('embeds:cat|tickets').setLabel('🎫 Tickets').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('embeds:cat|sorteios').setLabel('🎁 Sorteios').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('embeds:cat|moderacao').setLabel('🔨 Moderação').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('embeds:cat|selfrole').setLabel('🎭 Cargos').setStyle(ButtonStyle.Secondary),
    ),
  ];

  return { embed, rows };
}

function buildCategoryPanel(category: string): { embed: EmbedBuilder; rows: ActionRowBuilder<ButtonBuilder>[] } {
  const catLabel = EMBED_CATEGORIES[category] ?? category;
  const entries  = Object.entries(EMBED_CATALOG).filter(([, v]) => v.category === category);

  const embed = baseEmbed(COLORS.INFO)
    .setTitle(catLabel + ' — Embeds configuráveis')
    .setDescription('Selecione o embed que deseja personalizar:');
  
  embed.addFields(entries.map(([key, e]) => {
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
            .setCustomId('embeds:edit|' + key)
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
    .setTitle('✏️ Editar: ' + (info?.label ?? key))
    .setDescription('Personalize os campos do embed **' + (info?.label ?? key) + '**.\n\n📸 **Thumbnail e Imagem:** clique no botão e envie o arquivo diretamente — sem precisar de link!')
    .addFields(
      ALL_FIELDS.map(field => {
        const meta  = FIELD_META[field];
        const value = tpl?.[field as keyof typeof tpl];
        let display: string;
        if (field === 'color' && value) {
          display = intToHex(value as number);
        } else if ((field === 'imageUrl' || field === 'thumbnailUrl') && value) {
          display = '✅ Imagem configurada';
        } else {
          display = (value as string | null | undefined) ?? '*(padrão)*';
        }
        return { name: meta.emoji + ' ' + meta.label, value: display, inline: true };
      })
    );

  const imageFields = ['thumbnailUrl', 'imageUrl'] as const;

  const rows: ActionRowBuilder<ButtonBuilder>[] = [
    // Linha 1: title, description, color (sempre modal)
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      ALL_FIELDS.slice(0, 3).map(field =>
        new ButtonBuilder()
          .setCustomId('embeds:field|' + key + '|' + field)
          .setLabel(FIELD_META[field].emoji + ' ' + FIELD_META[field].label)
          .setStyle(ButtonStyle.Secondary)
      )
    ),
    // Linha 2: thumbnailUrl (upload), imageUrl (upload), footerText (modal), footerIcon (modal) + reset
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      [
        ...ALL_FIELDS.slice(3).map(field => {
          if (field === 'thumbnailUrl' || field === 'imageUrl') {
            return new ButtonBuilder()
              .setCustomId('embeds:upload_image|' + key + '|' + field)
              .setLabel(FIELD_META[field].emoji + ' ' + FIELD_META[field].label)
              .setStyle(ButtonStyle.Primary);
          }
          return new ButtonBuilder()
            .setCustomId('embeds:field|' + key + '|' + field)
            .setLabel(FIELD_META[field].emoji + ' ' + FIELD_META[field].label)
            .setStyle(ButtonStyle.Secondary);
        }),
        new ButtonBuilder()
          .setCustomId('embeds:reset|' + key)
          .setLabel('🗑️ Resetar Tudo')
          .setStyle(ButtonStyle.Danger),
      ]
    ),
    // Linha 3: voltar
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('embeds:cat|' + (info?.category ?? 'geral'))
        .setLabel('◀ Voltar')
        .setStyle(ButtonStyle.Secondary),
    ),
  ];

  return { embed, rows };
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// BUTTON HANDLER (raw — já é chamado com o interaction completo)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

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
          await i.editReply({ embeds: [errorEmbed('Embed não encontrado', 'Chave `' + key + '` inválida.')] });
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
          .setCustomId('embedcfg:field|' + key + '|' + field)
          .setTitle(meta.emoji + ' Editar ' + meta.label)
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

      case 'upload_image': {
        // Iniciar collector para upload de imagem ou thumbnail
        const key   = rest[0];
        const field = (rest[1] ?? 'imageUrl') as 'imageUrl' | 'thumbnailUrl';
        if (!EMBED_CATALOG[key]) {
          await i.reply({ embeds: [errorEmbed('Embed não encontrado', 'Chave `' + key + '` inválida.')] });
          return;
        }
        await startImageUploadCollector(i, key, field);
        break;
      }

      case 'reset': {
        await i.deferUpdate();
        const key = rest[0];
        await clearTemplate(key);
        const { embed, rows } = buildEditPanel(key);
        await i.editReply({ embeds: [successEmbed('✅ Resetado', 'Template `' + key + '` restaurado para o padrão.'), embed], components: rows });
        break;
      }

      default:
        await i.reply({ embeds: [errorEmbed('Ação desconhecida', 'Operação `' + op + '` não reconhecida.')], ephemeral: true });
    }
  } catch (err) {
    console.error('[EmbedsCfg Error]', err);
    const errEmbed = errorEmbed('Erro', 'Ocorreu um erro ao processar.');
    if (i.replied || i.deferred) await i.editReply({ embeds: [errEmbed] }).catch(() => null);
    else await i.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => null);
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MODAL HANDLER (para submissão dos campos via texto)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export async function handleEmbedCfgModal(i: ModalSubmitInteraction, raw: string): Promise<void> {
  if (!await isBotManager(i.user.id)) {
    await i.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas gerenciadores do bot podem usar.')], ephemeral: true });
    return;
  }

  const [op, ...rest] = raw.split('|');

  if (op === 'field') {
    await i.deferUpdate();
    const [key, field] = rest;
    let rawValue = i.fields.getTextInputValue('value').trim();

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
    await i.editReply({ embeds: [successEmbed('✅ Salvo', 'Campo **' + (FIELD_META[field]?.label ?? field) + '** atualizado!'), embed], components: rows });
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// COLLECTOR PARA UPLOAD DE IMAGENS (aguarda arquivo do usuário no chat)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export async function startImageUploadCollector(
  i: ButtonInteraction,
  key: string,
  field: 'imageUrl' | 'thumbnailUrl' = 'imageUrl',
): Promise<void> {
  if (!await isBotManager(i.user.id)) {
    await i.reply({ embeds: [errorEmbed('Sem permissão', 'Apenas gerenciadores do bot podem usar.')], ephemeral: true });
    return;
  }

  const fieldLabel = field === 'thumbnailUrl' ? 'Thumbnail' : 'Imagem';

  await i.reply({
    embeds: [baseEmbed(COLORS.INFO)
      .setTitle('📸 Upload de ' + fieldLabel)
      .setDescription(
        'Envie uma imagem como **arquivo anexado** nesta conversa.\n\n' +
        '**⏱️ Você tem 2 minutos para enviar.**\n\n' +
        '*Formatos aceitos: PNG, JPG, GIF, WebP*'
      )],
    ephemeral: true,
  });

  const channel = i.channel as TextChannel;
  if (!channel || !('createMessageCollector' in channel)) {
    await i.followUp({ embeds: [errorEmbed('Erro', 'Este canal não suporta upload.')], ephemeral: true });
    return;
  }

  const filter = (msg: Message) => msg.author.id === i.user.id && msg.attachments.size > 0;
  const collector = channel.createMessageCollector({ filter, time: 120000, max: 1 });

  collector.on('collect', async (msg: Message) => {
    try {
      const attachment = msg.attachments.first() as Attachment | undefined;
      if (!attachment) return;

      // Validar se é imagem
      const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(attachment.contentType ?? '')) {
        await msg.reply({ embeds: [errorEmbed('Tipo inválido', 'Envie uma imagem (PNG, JPG, GIF, WebP).')] }).catch(() => null);
        return;
      }

      // ── Correção: baixar os bytes ANTES de deletar a mensagem ───────────────
      // URLs do CDN do Discord ficam permanentemente inválidas quando a mensagem
      // que contém o attachment é deletada — mesmo o endpoint refresh-urls não
      // consegue recuperá-las. A solução é baixar os bytes enquanto a mensagem
      // ainda existe, reenviar como mensagem do próprio bot (cujo URL persiste
      // enquanto essa mensagem existir) e só então salvar essa URL persistente.
      const imgResponse = await fetch(attachment.url);
      if (!imgResponse.ok) throw new Error(`Falha ao baixar imagem: ${imgResponse.status}`);
      const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
      const imgName   = attachment.name ?? 'imagem.png';

      // Deletar a mensagem original do usuário (UX limpo)
      await msg.delete().catch(() => null);

      // Re-enviar como mensagem do bot para obter URL controlada e persistente
      const storageMsg = await channel.send({
        files: [{ attachment: imgBuffer, name: imgName }],
      });
      const imageUrl = storageMsg.attachments.first()!.url;
      // ────────────────────────────────────────────────────────────────────────

      // Salvar a URL persistente no template
      await setTemplateField(key, field as any, imageUrl);
      const { embed, rows } = buildEditPanel(key);

      await i.followUp({
        embeds: [
          successEmbed('✅ ' + fieldLabel + ' Salva!', fieldLabel + ' atualizada para o embed **' + (EMBED_CATALOG[key]?.label ?? key) + '**!'),
          embed,
        ],
        components: rows,
        ephemeral: true,
      });
    } catch (err) {
      console.error('[Image Upload Error]', err);
      await i.followUp({ embeds: [errorEmbed('Erro', 'Ocorreu um erro ao processar a imagem.')], ephemeral: true });
    }
  });

  collector.on('end', (collected: any) => {
    if (collected.size === 0) {
      i.followUp({ embeds: [errorEmbed('⏰ Tempo expirado', 'Você não enviou nenhuma imagem a tempo.')], ephemeral: true }).catch(() => null);
    }
  });
}
