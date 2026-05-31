import { REST, Routes } from "discord.js";
import { clipCommands } from "./commands/clipCommands.js";
import { clipEnv } from "./config/clipEnv.js";

const rest = new REST({ version: "10" }).setToken(clipEnv.token);
const body = clipCommands.map((command) => command.data.toJSON());

if (clipEnv.guildId) {
  await rest.put(Routes.applicationGuildCommands(clipEnv.clientId, clipEnv.guildId), { body });
  console.log(`Registered ${body.length} clip guild commands for ${clipEnv.guildId}.`);
} else {
  await rest.put(Routes.applicationCommands(clipEnv.clientId), { body });
  console.log(`Registered ${body.length} global clip commands.`);
}
