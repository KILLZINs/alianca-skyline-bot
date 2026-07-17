import { Client, Collection, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  category?: string;
  execute: (interaction: ChatInputCommandInteraction) => Promise<unknown>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
  cooldowns: Collection<string, Collection<string, number>>;
}

export function xpForNextLevel(level: number): number {
  return 100 + level * 50;
}

export const OWNER_ID = process.env.OWNER_ID ?? '1195254699943796791';

export const RANKS = [
  'Recruta',
  'Membro',
  'Veterano',
  'Elite',
  'Capitão',
  'Comandante',
  'Líder',
] as const;

export type Rank = (typeof RANKS)[number];
