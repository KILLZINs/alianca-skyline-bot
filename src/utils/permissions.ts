import { GuildMember, ChatInputCommandInteraction, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction } from 'discord.js';
import { OWNER_ID } from '../types';
import { getConfig } from './helpers';
import { errorEmbed } from './embeds';

type AnyInteraction = ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;

export function isOwner(userId: string): boolean {
  return userId === OWNER_ID || userId === (process.env.OWNER_ID ?? '');
}

export async function isAdmin(member: GuildMember, guildId: string): Promise<boolean> {
  if (isOwner(member.id)) return true;
  if (member.permissions.has('Administrator')) return true;
  const config = await getConfig(guildId);
  if (config.adminRoleId && member.roles.cache.has(config.adminRoleId)) return true;
  return false;
}

export async function isModerator(member: GuildMember, guildId: string): Promise<boolean> {
  if (await isAdmin(member, guildId)) return true;
  const config = await getConfig(guildId);
  if (config.modRoleId && member.roles.cache.has(config.modRoleId)) return true;
  return false;
}

export async function checkAdmin(interaction: AnyInteraction): Promise<boolean> {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({ embeds: [errorEmbed('Erro', 'Este comando só pode ser usado em servidores.')], ephemeral: true });
    return false;
  }
  const member = interaction.member as GuildMember;
  if (!(await isAdmin(member, interaction.guild.id))) {
    await interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Você precisa ser administrador para usar isso.')], ephemeral: true });
    return false;
  }
  return true;
}

export async function checkModerator(interaction: AnyInteraction): Promise<boolean> {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({ embeds: [errorEmbed('Erro', 'Este comando só pode ser usado em servidores.')], ephemeral: true });
    return false;
  }
  const member = interaction.member as GuildMember;
  if (!(await isModerator(member, interaction.guild.id))) {
    await interaction.reply({ embeds: [errorEmbed('Sem Permissão', 'Você precisa ser moderador para usar isso.')], ephemeral: true });
    return false;
  }
  return true;
}
