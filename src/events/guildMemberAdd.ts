import { GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { getOrCreateMember, getConfig } from '../utils/helpers';
import { COLORS, EMOJIS } from '../utils/embeds';

export default {
  name: 'guildMemberAdd',
  once: false,
  async execute(member: GuildMember) {
    await getOrCreateMember(member.id, member.user.username).catch(console.error);

    const config = await getConfig(member.guild.id);

    // Auto-assign member role
    const memberRoleId = config.memberRoleId ?? process.env.MEMBER_ROLE_ID;
    if (memberRoleId) {
      const role = member.guild.roles.cache.get(memberRoleId);
      if (role) await member.roles.add(role).catch(console.error);
    }

    // Welcome message
    const welcomeChannelId = config.welcomeChannelId ?? process.env.WELCOME_CHANNEL_ID;
    if (!welcomeChannelId) return;
    const channel = member.guild.channels.cache.get(welcomeChannelId) as TextChannel | undefined;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.SPARKLES} Bem-vindo(a) à Aliança Skyline!`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setDescription(
        `Olá, ${member}! Estamos felizes em ter você conosco. 💜\n\n` +
        `${EMOJIS.SHIELD} **Aliança Skyline** — Unidos somos mais fortes.\n\n` +
        `Use \`/painel\` para ver tudo o que o bot oferece!`
      )
      .addFields(
        { name: '👥 Você é o membro', value: `**#${member.guild.memberCount}**`, inline: true },
        { name: '📅 Conta criada em', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true },
      )
      .setFooter({ text: '⚔️ Aliança Skyline' })
      .setTimestamp();

    await channel.send({ content: `👋 Boas-vindas, ${member}!`, embeds: [embed] }).catch(console.error);
  },
};
