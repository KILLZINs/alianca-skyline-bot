/**
    * messageCommandShim — cria um objeto que imita ChatInputCommandInteraction
    * a partir de uma Message, permitindo que slash commands sejam chamados via prefix.
    */
    import {
    Message,
    TextChannel,
    ChatInputCommandInteraction,
    GuildMember,
    User,
    } from 'discord.js';

    type ReplyPayload = Parameters<Message['reply']>[0];

    export function createMessageShim(
    message: Message,
    commandName: string,
    args: string[],
    ): ChatInputCommandInteraction {
    let sentMsg: Awaited<ReturnType<Message['reply']>> | null = null;
    let _deferred = false;
    let _replied   = false;

    /** Remove campos que Message.reply não aceita (ephemeral, fetchReply, flags) */
    const sanitize = (opts: unknown): ReplyPayload => {
      if (typeof opts === 'string') return opts;
      const { ephemeral: _e, fetchReply: _f, flags: _fl, ...rest } = opts as Record<string, unknown>;
      return rest as ReplyPayload;
    };

    const shim = {
      // ── Identity ───────────────────────────────────────────────────────────
      commandName,
      commandType: 1,
      type: 2,
      id: message.id,
      token: '',
      version: 1,
      appPermissions: null,
      applicationId: message.client.user?.id ?? '',
      locale: 'pt-BR' as const,
      guildLocale: 'pt-BR' as const,

      // ── Context ────────────────────────────────────────────────────────────
      guild:             message.guild,
      guildId:           message.guildId,
      channel:           message.channel,
      channelId:         message.channelId,
      user:              message.author as User,
      member:            message.member as GuildMember,
      memberPermissions: (message.member as GuildMember | null)?.permissions ?? null,
      client:            message.client,
      createdTimestamp:  message.createdTimestamp,
      createdAt:         message.createdAt,

      // ── State ──────────────────────────────────────────────────────────────
      get deferred() { return _deferred; },
      get replied()  { return _replied; },

      // ── Reply methods ──────────────────────────────────────────────────────
      async reply(opts: unknown): Promise<unknown> {
        sentMsg = await message.reply(sanitize(opts)).catch(() => null);
        _replied = true;
        return sentMsg;
      },

      async deferReply(_opts?: unknown): Promise<void> {
        _deferred = true;
        await (message.channel as TextChannel).sendTyping().catch(() => null);
      },

      async editReply(opts: unknown): Promise<unknown> {
        const payload = sanitize(opts);
        if (sentMsg) return sentMsg.edit(payload as Parameters<typeof sentMsg.edit>[0]).catch(() => null);
        sentMsg = await message.reply(payload).catch(() => null);
        _replied = true;
        return sentMsg;
      },

      async followUp(opts: unknown): Promise<unknown> {
        const payload = sanitize(opts);
        return (message.channel as TextChannel).send(payload as Parameters<TextChannel['send']>[0]).catch(() => null);
      },

      async fetchReply(): Promise<unknown> { return sentMsg; },

      // ── Type guards ────────────────────────────────────────────────────────
      isChatInputCommand:  () => true,
      isButton:            () => false,
      isModalSubmit:       () => false,
      isAnySelectMenu:     () => false,
      isRepliable:         () => true,
      inGuild:             () => !!message.guild,
      inCachedGuild:       () => !!message.guild,
      isCommand:           () => true,

      // ── Options ────────────────────────────────────────────────────────────
      options: {
        data: [],
        resolved: null,
        _group: null,
        _subcommand: null,
        _hoistedOptions: [],
        client: message.client,

        getString(_name: string, _req?: boolean): string | null {
          return args[0] ?? null;
        },
        getInteger(_name: string, _req?: boolean): number | null {
          const n = parseInt(args[0] ?? '', 10);
          return isNaN(n) ? null : n;
        },
        getNumber(_name: string, _req?: boolean): number | null {
          const n = parseFloat(args[0] ?? '');
          return isNaN(n) ? null : n;
        },
        getBoolean(_name: string, _req?: boolean): boolean | null { return null; },
        getUser(_name: string, _req?: boolean): User | null {
          return (message.mentions.users.first() as User | undefined) ?? null;
        },
        getMember(_name: string, _req?: boolean): GuildMember | null {
          return (message.mentions.members?.first() as GuildMember | undefined)
            ?? (message.member as GuildMember | null);
        },
        getChannel(_name: string, _req?: boolean) {
          return message.mentions.channels.first() ?? null;
        },
        getRole(_name: string, _req?: boolean) {
          return message.mentions.roles.first() ?? null;
        },
        getSubcommand(_req?: boolean): string | null { return null; },
        getSubcommandGroup(_req?: boolean): string | null { return null; },
        getAttachment(_name: string, _req?: boolean) { return null; },
        getFocused(_asFullAuto?: boolean) { return ''; },
      },
    };

    return shim as unknown as ChatInputCommandInteraction;
    }
    