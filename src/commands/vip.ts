// ════════════════════════════════════════════════════════════════════════════
// COMANDO /vip — Sistema de Cargos VIP Personalizados
// ════════════════════════════════════════════════════════════════════════════

import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Command } from '../types';
import { prisma } from '../database/client';
import { errorEmbed } from '../utils/embeds';
import { checkAdmin } from '../utils/permissions';
import { buildVipPanel, buildVipAdminPanel } from '../handlers/vipHandler';

export default {
  category: 'utilidade',
  data: new SlashCommandBuilder()
    .setName('vip')
    .setDescription('Sistema de cargos VIP personalizados')
    .addSubcommand(sub =>
      sub.setName('painel').setDescription('Abrir seu painel VIP (criar e gerenciar seus cargos personalizados)')
    )
    .addSubcommand(sub =>
      sub.setName('config').setDescription('Configurar os cargos que dão acesso ao sistema VIP (Admin)')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'config') {
      if (!(await checkAdmin(interaction))) return;
      const { embed, rows } = await buildVipAdminPanel(interaction.guild!);
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    }

    // sub === 'painel'
    await interaction.deferReply({ ephemeral: true });

    const guild  = interaction.guild!;
    const member = interaction.member as GuildMember;

    // Verifica se o usuário tem algum cargo VIP configurado
    const vipConfigs = await prisma.vipConfig.findMany({ where: { guildId: guild.id } });
    const hasVip = vipConfigs.some(vc => member.roles.cache.has(vc.roleId));

    if (!hasVip) {
      return interaction.editReply({
        embeds: [errorEmbed('Sem Acesso VIP', 'Você não possui um cargo VIP neste servidor.\nFale com um administrador para obter acesso.')],
      });
    }

    const { embed, rows } = await buildVipPanel(guild, interaction.user.id);
    return interaction.editReply({ embeds: [embed], components: rows });
  },
} satisfies Command;
