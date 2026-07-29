import { GuildMember, PartialGuildMember } from 'discord.js';
import { sendLog, logRoleChange, logNicknameChange, logTimeout, LOG } from '../utils/logger';

export default {
  name: 'guildMemberUpdate',
  once: false,
  async execute(before: GuildMember | PartialGuildMember, after: GuildMember) {
    const guild = after.guild;

    // ── Cargos ────────────────────────────────────────────────────────
    if (before.roles && after.roles) {
      const addedRoles   = after.roles.cache.filter(r => !before.roles.cache.has(r.id) && r.id !== guild.id);
      const removedRoles = before.roles.cache.filter(r => !after.roles.cache.has(r.id) && r.id !== guild.id);

      if (addedRoles.size > 0 || removedRoles.size > 0) {
        await sendLog(
          guild,
          LOG.MEMBERS,
          logRoleChange(
            after,
            addedRoles.map(r => r.toString()),
            removedRoles.map(r => r.toString()),
          ),
        );
      }
    }

    // ── Apelido ───────────────────────────────────────────────────────
    if (before.nickname !== after.nickname) {
      await sendLog(guild, LOG.MEMBERS, logNicknameChange(after, before.nickname ?? null, after.nickname ?? null));
    }

    // ── Timeout ───────────────────────────────────────────────────────
    const beforeTimeout = (before as GuildMember).communicationDisabledUntil;
    const afterTimeout  = after.communicationDisabledUntil;

    if (beforeTimeout?.getTime() !== afterTimeout?.getTime()) {
      await sendLog(guild, LOG.MEMBERS, logTimeout(after, afterTimeout ?? null));
    }
  },
};
