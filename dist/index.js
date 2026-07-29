"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const client_1 = require("./database/client");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildMessageReactions,
        discord_js_1.GatewayIntentBits.GuildModeration,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel, discord_js_1.Partials.Reaction],
});
client.commands = new discord_js_1.Collection();
client.prefixCommands = new discord_js_1.Collection();
client.cooldowns = new discord_js_1.Collection();
// ─── Load slash commands (supports subfolders one level deep) ─────────────────
const commandsPath = (0, path_1.join)(__dirname, 'commands');
for (const entry of (0, fs_1.readdirSync)(commandsPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
        const folderPath = (0, path_1.join)(commandsPath, entry.name);
        for (const file of (0, fs_1.readdirSync)(folderPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'))) {
            const command = require((0, path_1.join)(folderPath, file)).default;
            if (command?.data && typeof command.execute === 'function') {
                client.commands.set(command.data.name, command);
            }
        }
    }
    else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        const command = require((0, path_1.join)(commandsPath, entry.name)).default;
        if (command?.data && typeof command.execute === 'function') {
            client.commands.set(command.data.name, command);
        }
    }
}
// ─── Load prefix commands ─────────────────────────────────────────────────────
const prefixCommandsPath = (0, path_1.join)(__dirname, 'prefix-commands');
try {
    for (const file of (0, fs_1.readdirSync)(prefixCommandsPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'))) {
        const cmd = require((0, path_1.join)(prefixCommandsPath, file)).default;
        if (cmd?.name && typeof cmd.execute === 'function') {
            client.prefixCommands.set(cmd.name, cmd);
        }
    }
}
catch {
    // pasta ainda não existe em tempo de execução — ignora silenciosamente
}
// ─── Load events ──────────────────────────────────────────────────────────────
const eventsPath = (0, path_1.join)(__dirname, 'events');
for (const file of (0, fs_1.readdirSync)(eventsPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'))) {
    const event = require((0, path_1.join)(eventsPath, file)).default;
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}
// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown() {
    console.log('Shutting down...');
    await client_1.prisma.$disconnect();
    client.destroy();
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
client.login(process.env.DISCORD_TOKEN).catch(console.error);
//# sourceMappingURL=index.js.map