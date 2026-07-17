import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../types';
import { COLORS, EMOJIS, baseEmbed } from '../utils/embeds';
import { getConfig } from '../utils/helpers';
import { checkAdmin } from '../utils/permissions';

export default {
  category: 'admin',
  data: new SlashCommandBuilder().setName('config').setDescription('Visualiza e edita as configurações do bot neste servidor'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await checkAdmin(interaction))) return;
    const cfg = await getConfig(interaction.guild!.id);
    const embed = baseEmbed(COLORS.DARK)
      .setTitle(`${EMOJIS.GEAR} Configuração — ${interaction.guild!.name}`)
      .addFields(
        { name: '📋 Canal de Log', value: cfg.logChannelId ? `<#${cfg.logChannelId}>` : '`Não definido`', inline: true },
        { name: '👋 Boas-vindas', value: cfg.welcomeChannelId ? `<#${cfg.welcomeChannelId}>` : '`Não definido`', inline: true },
        { name: '📢 Anúncios', value: cfg.announcementChannelId ? `<#${cfg.announcementChannelId}>` : '`Não definido`', inline: true },
        { name: '🎫 Cat. Tickets', value: cfg.ticketCategoryId ? `<#${cfg.ticketCategoryId}>` : '`Não definido`', inline: true },
        { name: '📁 Log Tickets', value: cfg.ticketLogChannelId ? `<#${cfg.ticketLogChannelId}>` : '`Não definido`', inline: true },
        { name: '🆙 Level-Up', value: cfg.levelUpChannelId ? `<#${cfg.levelUpChannelId}>` : '`Não definido`', inline: true },
        { name: '💡 Sugestões', value: cfg.suggestionChannelId ? `<#${cfg.suggestionChannelId}>` : '`Não definido`', inline: true },
        { name: '👑 Cargo Admin', value: cfg.adminRoleId ? `<@&${cfg.adminRoleId}>` : '`Não definido`', inline: true },
        { name: '🛡️ Cargo Mod', value: cfg.modRoleId ? `<@&${cfg.modRoleId}>` : '`Não definido`', inline: true },
        { name: '⭐ Cargo Membro', value: cfg.memberRoleId ? `<@&${cfg.memberRoleId}>` : '`Não definido`', inline: true },
        { name: '🔇 Cargo Mutado', value: cfg.mutedRoleId ? `<@&${cfg.mutedRoleId}>` : '`Não definido`', inline: true },
      );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('config:canais').setLabel('Configurar Canais').setEmoji('#️⃣').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('config:cargos').setLabel('Configurar Cargos').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
} satisfies Command;
