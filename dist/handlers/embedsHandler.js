"use strict";
// ═══════════════════════════════════════════════════════════════════════
// HANDLER: /embeds — customização total de embeds
// ═══════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEmbedsHome = buildEmbedsHome;
exports.handleEmbedsButtonRaw = handleEmbedsButtonRaw;
exports.handleEmbedCfgModal = handleEmbedCfgModal;
exports.startImageUploadCollector = startImageUploadCollector;
const discord_js_1 = require("discord.js");
const embedTemplates_1 = require("../utils/embedTemplates");
const embeds_1 = require("../utils/embeds");
const allowlist_1 = require("../utils/allowlist");
// ── Tipos dos campos configuráveis ────────────────────────────────────
const FIELD_META = {
    title:       { label: 'Título',          emoji: '📌', placeholder: 'Título do embed (máx 256 chars)',      style: discord_js_1.TextInputStyle.Short,     max: 256  },
    description: { label: 'Descrição',       emoji: '📄', placeholder: 'Descrição / conteúdo principal...',    style: discord_js_1.TextInputStyle.Paragraph, max: 4000 },
    color:       { label: 'Cor (hex)',        emoji: '🎨', placeholder: '#9B59B6 (hex 6 dígitos)',              style: discord_js_1.TextInputStyle.Short,     max: 7    },
    thumbnailUrl:{ label: 'Thumbnail',        emoji: '🖼️', placeholder: 'Clique e envie uma imagem no chat',   style: discord_js_1.TextInputStyle.Short,     max: 512  },
    imageUrl:    { label: 'Imagem',           emoji: '📸', placeholder: 'Clique e envie uma imagem no chat',   style: discord_js_1.TextInputStyle.Short,     max: 512  },
    footerText:  { label: 'Texto do Rodapé', emoji: '📝', placeholder: '⚔️ Aliança Skyline',                  style: discord_js_1.TextInputStyle.Short,     max: 2048 },
    footerIcon:  { label: 'Ícone do Rodapé', emoji: '🔗', placeholder: 'https://... (ícone URL)',              style: discord_js_1.TextInputStyle.Short,     max: 512  },
};
const ALL_FIELDS = Object.keys(FIELD_META);
// ══════════════════════════════════════════════════════════════════════
// BUILD PANELS
// ══════════════════════════════════════════════════════════════════════
function buildEmbedsHome() {
    const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.PRIMARY)
        .setTitle('⚙️ Customização de Embeds')
        .setDescription('Personalize **título, descrição, cor, imagens e rodapé** de cada embed do bot.\n\n' +
        '📸 **Imagens:** Clique no botão e envie o arquivo diretamente — sem precisar de link!\n\n' +
        'Selecione uma categoria para começar:')
        .addFields(
            { name: '🎯 Geral',       value: 'Boas-vindas, Level Up, Roleplay, Painel',            inline: true },
            { name: '⚔️ RPG',         value: 'Vitória, Derrota, Empate, Level Up, Reencarnação',   inline: true },
            { name: '🐉 Boss Mundial', value: 'Spawn, Derrota e Expiração do Boss Mundial',         inline: true },
            { name: '💍 Casamento',    value: 'Proposta, Casamento e Divórcio',                     inline: true },
            { name: '📋 Missões',      value: 'Missão diária e semanal concluída',                  inline: true },
            { name: '🌐 Aliança',      value: 'Embed oficial da aliança',                           inline: true },
            { name: '🎫 Tickets',      value: 'Ticket criado, fechado e assumido',                  inline: true },
            { name: '🎁 Sorteios',     value: 'Sorteio iniciado e anúncio de vencedor',             inline: true },
            { name: '🔨 Moderação',    value: 'Aviso, ban e kick aplicados',                        inline: true },
            { name: '🎭 Cargos',       value: 'Cargo adicionado e removido (self-role)',            inline: true }
        );
    const rows = [
        new discord_js_1.ActionRowBuilder().addComponents(
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|geral').setLabel('🎯 Geral').setStyle(discord_js_1.ButtonStyle.Primary),
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|rpg').setLabel('⚔️ RPG').setStyle(discord_js_1.ButtonStyle.Danger),
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|bossmundial').setLabel('🐉 Boss').setStyle(discord_js_1.ButtonStyle.Danger),
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|casamento').setLabel('💍 Casamento').setStyle(discord_js_1.ButtonStyle.Success),
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|missoes').setLabel('📋 Missões').setStyle(discord_js_1.ButtonStyle.Secondary)
        ),
        new discord_js_1.ActionRowBuilder().addComponents(
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|alianca').setLabel('🌐 Aliança').setStyle(discord_js_1.ButtonStyle.Secondary),
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|tickets').setLabel('🎫 Tickets').setStyle(discord_js_1.ButtonStyle.Primary),
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|sorteios').setLabel('🎁 Sorteios').setStyle(discord_js_1.ButtonStyle.Success),
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|moderacao').setLabel('🔨 Moderação').setStyle(discord_js_1.ButtonStyle.Danger),
            new discord_js_1.ButtonBuilder().setCustomId('embeds:cat|selfrole').setLabel('🎭 Cargos').setStyle(discord_js_1.ButtonStyle.Secondary)
        ),
    ];
    return { embed, rows };
}
function buildCategoryPanel(category) {
    const catLabel = embedTemplates_1.EMBED_CATEGORIES[category] ?? category;
    const entries = Object.entries(embedTemplates_1.EMBED_CATALOG).filter(([, v]) => v.category === category);
    const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO)
        .setTitle(`${catLabel} — Embeds configuráveis`)
        .setDescription('Selecione o embed que deseja personalizar:')
        .addFields(entries.map(([key, e]) => {
        const tpl = (0, embedTemplates_1.getTemplate)(key);
        const hasConfig = tpl && Object.values(tpl).some(v => v !== null && v !== key);
        return { name: e.label + (hasConfig ? ' ✅' : ''), value: e.desc, inline: false };
    }));
    const rows = [];
    for (let i = 0; i < entries.length; i += 4) {
        const chunk = entries.slice(i, i + 4);
        rows.push(new discord_js_1.ActionRowBuilder().addComponents(chunk.map(([key, e]) => new discord_js_1.ButtonBuilder()
            .setCustomId(`embeds:edit|${key}`)
            .setLabel(e.label.replace(/^[^\s]+\s/, ''))
            .setStyle(discord_js_1.ButtonStyle.Primary))));
    }
    rows.push(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('embeds:home').setLabel('◀ Voltar').setStyle(discord_js_1.ButtonStyle.Secondary)));
    return { embed, rows };
}
function buildEditPanel(key) {
    const info = embedTemplates_1.EMBED_CATALOG[key];
    const tpl = (0, embedTemplates_1.getTemplate)(key);
    const embed = (0, embeds_1.baseEmbed)(embeds_1.COLORS.WARNING)
        .setTitle(`✏️ Editar: ${info?.label ?? key}`)
        .setDescription(`Personalize os campos do embed **${info?.label ?? key}**.\n\n📸 **Thumbnail e Imagem:** clique no botão e envie o arquivo — sem precisar de link!`)
        .addFields(ALL_FIELDS.map(field => {
        const meta = FIELD_META[field];
        const value = tpl?.[field];
        let display;
        if (field === 'color' && value) {
            display = (0, embedTemplates_1.intToHex)(value);
        } else if ((field === 'imageUrl' || field === 'thumbnailUrl') && value) {
            display = '✅ Imagem configurada';
        } else {
            display = value ?? '*(padrão)*';
        }
        return { name: `${meta.emoji} ${meta.label}`, value: `${display}`, inline: true };
    }));
    // Linha 1: title, description, color, thumbnailUrl — sendo thumbnailUrl via upload
    const row1Buttons = ALL_FIELDS.slice(0, 4).map(field => {
        if (field === 'thumbnailUrl') {
            return new discord_js_1.ButtonBuilder()
                .setCustomId(`embeds:upload_image|${key}|thumbnailUrl`)
                .setLabel(`${FIELD_META[field].emoji} ${FIELD_META[field].label}`)
                .setStyle(discord_js_1.ButtonStyle.Primary);
        }
        return new discord_js_1.ButtonBuilder()
            .setCustomId(`embeds:field|${key}|${field}`)
            .setLabel(`${FIELD_META[field].emoji} ${FIELD_META[field].label}`)
            .setStyle(discord_js_1.ButtonStyle.Secondary);
    });
    // Linha 2: imageUrl (upload), footerText, footerIcon + reset
    const row2Buttons = [
        ...ALL_FIELDS.slice(4).map(field => {
            if (field === 'imageUrl') {
                return new discord_js_1.ButtonBuilder()
                    .setCustomId(`embeds:upload_image|${key}|imageUrl`)
                    .setLabel(`${FIELD_META[field].emoji} ${FIELD_META[field].label}`)
                    .setStyle(discord_js_1.ButtonStyle.Primary);
            }
            return new discord_js_1.ButtonBuilder()
                .setCustomId(`embeds:field|${key}|${field}`)
                .setLabel(`${FIELD_META[field].emoji} ${FIELD_META[field].label}`)
                .setStyle(discord_js_1.ButtonStyle.Secondary);
        }),
        new discord_js_1.ButtonBuilder()
            .setCustomId(`embeds:reset|${key}`)
            .setLabel('🗑️ Resetar Tudo')
            .setStyle(discord_js_1.ButtonStyle.Danger),
    ];
    const rows = [
        new discord_js_1.ActionRowBuilder().addComponents(row1Buttons),
        new discord_js_1.ActionRowBuilder().addComponents(row2Buttons),
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`embeds:cat|${info?.category ?? 'geral'}`)
            .setLabel('◀ Voltar')
            .setStyle(discord_js_1.ButtonStyle.Secondary)),
    ];
    return { embed, rows };
}
// ══════════════════════════════════════════════════════════════════════
// BUTTON HANDLER (raw — já é chamado com o interaction completo)
// ══════════════════════════════════════════════════════════════════════
async function handleEmbedsButtonRaw(i) {
    if (!await (0, allowlist_1.isBotManager)(i.user.id)) {
        await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem permissão', 'Apenas gerenciadores do bot podem usar.')], ephemeral: true });
        return;
    }
    const raw = i.customId.replace(/^embeds:/, '');
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
                if (!embedTemplates_1.EMBED_CATALOG[key]) {
                    await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Embed não encontrado', `Chave \`${key}\` inválida.`)] });
                    return;
                }
                const { embed, rows } = buildEditPanel(key);
                await i.editReply({ embeds: [embed], components: rows });
                break;
            }
            case 'field': {
                // Abrir modal para editar campo específico (título, descrição, cor, rodapé)
                const [key, field] = rest;
                if (!embedTemplates_1.EMBED_CATALOG[key] || !FIELD_META[field]) {
                    await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Inválido', 'Campo ou embed inválido.')], ephemeral: true });
                    return;
                }
                const meta = FIELD_META[field];
                const tpl = (0, embedTemplates_1.getTemplate)(key);
                const current = field === 'color' && tpl?.color ? (0, embedTemplates_1.intToHex)(tpl.color) : (tpl?.[field] ?? '');
                const modal = new discord_js_1.ModalBuilder()
                    .setCustomId(`embedcfg:field|${key}|${field}`)
                    .setTitle(`${meta.emoji} Editar ${meta.label}`)
                    .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                    .setCustomId('value')
                    .setLabel(meta.label)
                    .setStyle(meta.style)
                    .setRequired(false)
                    .setPlaceholder(meta.placeholder)
                    .setMaxLength(meta.max)
                    .setValue(current.toString().slice(0, meta.max))));
                await i.showModal(modal);
                break;
            }
            case 'upload_image': {
                // Iniciar collector de upload — sem modal, sem link
                const key   = rest[0];
                const field = rest[1] ?? 'imageUrl';
                if (!embedTemplates_1.EMBED_CATALOG[key]) {
                    await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Embed não encontrado', `Chave \`${key}\` inválida.`)], ephemeral: true });
                    return;
                }
                await startImageUploadCollector(i, key, field);
                break;
            }
            case 'reset': {
                await i.deferUpdate();
                const key = rest[0];
                await (0, embedTemplates_1.clearTemplate)(key);
                const { embed, rows } = buildEditPanel(key);
                await i.editReply({ embeds: [(0, embeds_1.successEmbed)('✅ Resetado', `Template \`${key}\` restaurado para o padrão.`), embed], components: rows });
                break;
            }
            default:
                await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Ação desconhecida', `Operação \`${op}\` não reconhecida.`)], ephemeral: true });
        }
    }
    catch (err) {
        console.error('[EmbedsCfg Error]', err);
        const errEmbed = (0, embeds_1.errorEmbed)('Erro', 'Ocorreu um erro ao processar.');
        if (i.replied || i.deferred)
            await i.editReply({ embeds: [errEmbed] }).catch(() => null);
        else
            await i.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => null);
    }
}
// ══════════════════════════════════════════════════════════════════════
// MODAL HANDLER (para submissão dos campos de texto)
// ══════════════════════════════════════════════════════════════════════
async function handleEmbedCfgModal(i, raw) {
    if (!await (0, allowlist_1.isBotManager)(i.user.id)) {
        await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem permissão', 'Apenas gerenciadores do bot podem usar.')], ephemeral: true });
        return;
    }
    const [op, ...rest] = raw.split('|');
    if (op === 'field') {
        await i.deferUpdate();
        const [key, field] = rest;
        const rawValue = i.fields.getTextInputValue('value').trim();
        if (!rawValue) {
            await (0, embedTemplates_1.setTemplateField)(key, field, null);
        }
        else if (field === 'color') {
            const colorInt = (0, embedTemplates_1.hexToInt)(rawValue);
            if (colorInt === null) {
                await i.editReply({ embeds: [(0, embeds_1.errorEmbed)('Cor inválida', 'Use formato hex como `#9B59B6`.')] });
                return;
            }
            await (0, embedTemplates_1.setTemplateField)(key, 'color', colorInt);
        }
        else {
            await (0, embedTemplates_1.setTemplateField)(key, field, rawValue);
        }
        const { embed, rows } = buildEditPanel(key);
        await i.editReply({ embeds: [(0, embeds_1.successEmbed)('✅ Salvo', `Campo **${FIELD_META[field]?.label ?? field}** atualizado!`), embed], components: rows });
    }
}
// ══════════════════════════════════════════════════════════════════════
// COLLECTOR DE UPLOAD DE IMAGEM (sem link — o usuário envia o arquivo)
// ══════════════════════════════════════════════════════════════════════
async function startImageUploadCollector(i, key, field = 'imageUrl') {
    if (!await (0, allowlist_1.isBotManager)(i.user.id)) {
        await i.reply({ embeds: [(0, embeds_1.errorEmbed)('Sem permissão', 'Apenas gerenciadores do bot podem usar.')], ephemeral: true });
        return;
    }
    const fieldLabel = field === 'thumbnailUrl' ? 'Thumbnail' : 'Imagem';
    await i.reply({
        embeds: [(0, embeds_1.baseEmbed)(embeds_1.COLORS.INFO)
            .setTitle(`📸 Upload de ${fieldLabel}`)
            .setDescription('Envie uma imagem como **arquivo anexado** nesta conversa.\n\n' +
            '**⏱️ Você tem 2 minutos para enviar.**\n\n' +
            '*Formatos aceitos: PNG, JPG, GIF, WebP*')],
        ephemeral: true,
    });
    const channel = i.channel;
    if (!channel || !('createMessageCollector' in channel)) {
        await i.followUp({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'Este canal não suporta upload.')], ephemeral: true });
        return;
    }
    const filter = (msg) => msg.author.id === i.user.id && msg.attachments.size > 0;
    const collector = channel.createMessageCollector({ filter, time: 120000, max: 1 });
    collector.on('collect', async (msg) => {
        try {
            const attachment = msg.attachments.first();
            if (!attachment) return;
            const imageUrl = attachment.url;
            const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
            if (!validTypes.includes(attachment.contentType ?? '')) {
                await msg.reply({ embeds: [(0, embeds_1.errorEmbed)('Tipo inválido', 'Envie uma imagem (PNG, JPG, GIF, WebP).')] }).catch(() => null);
                return;
            }
            await (0, embedTemplates_1.setTemplateField)(key, field, imageUrl);
            const { embed, rows } = buildEditPanel(key);
            await i.followUp({
                embeds: [
                    (0, embeds_1.successEmbed)(`✅ ${fieldLabel} Salva!`, `${fieldLabel} atualizada para o embed **${embedTemplates_1.EMBED_CATALOG[key]?.label ?? key}**!`),
                    embed,
                ],
                components: rows,
                ephemeral: true,
            });
            await msg.delete().catch(() => null);
        }
        catch (err) {
            console.error('[Image Upload Error]', err);
            await i.followUp({ embeds: [(0, embeds_1.errorEmbed)('Erro', 'Ocorreu um erro ao processar a imagem.')], ephemeral: true });
        }
    });
    collector.on('end', (collected) => {
        if (collected.size === 0) {
            i.followUp({ embeds: [(0, embeds_1.errorEmbed)('⏰ Tempo expirado', 'Você não enviou nenhuma imagem a tempo.')], ephemeral: true }).catch(() => null);
        }
    });
}
//# sourceMappingURL=embedsHandler.js.map
