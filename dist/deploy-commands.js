"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const commands = [];
const commandsPath = (0, path_1.join)(__dirname, 'commands');
for (const entry of (0, fs_1.readdirSync)(commandsPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
        const folderPath = (0, path_1.join)(commandsPath, entry.name);
        for (const file of (0, fs_1.readdirSync)(folderPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'))) {
            const command = require((0, path_1.join)(folderPath, file)).default;
            if (command?.data)
                commands.push(command.data.toJSON());
        }
    }
    else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        const command = require((0, path_1.join)(commandsPath, entry.name)).default;
        if (command?.data)
            commands.push(command.data.toJSON());
    }
}
const rest = new discord_js_1.REST().setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        console.log(`🔄 Registrando ${commands.length} comandos slash...`);
        const guildId = process.env.GUILD_ID;
        if (guildId) {
            await rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: commands });
            console.log(`✅ Comandos registrados no servidor ${guildId}`);
        }
        else {
            await rest.put(discord_js_1.Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
            console.log('✅ Comandos registrados globalmente');
        }
    }
    catch (err) {
        console.error('❌ Erro ao registrar comandos:', err);
    }
})();
//# sourceMappingURL=deploy-commands.js.map