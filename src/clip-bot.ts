import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions
} from "discord.js";
import { clipCommands } from "./commands/clipCommands.js";
import { clipEnv } from "./config/clipEnv.js";
import { ClipRecorder } from "./services/clipRecorder.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

const recorder = new ClipRecorder({
  ffmpegPath: clipEnv.ffmpegPath
});
const commandCollection = new Collection(clipCommands.map((command) => [command.data.name, command]));

await recorder.cleanupStaleTempFiles();

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Clip bot logged in as ${readyClient.user.tag}`);
  console.log(`Loaded ${clipCommands.length} clip slash commands.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandCollection.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: "I do not know that clip command yet.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    await command.execute(interaction as ChatInputCommandInteraction, client, recorder);
  } catch (error) {
    console.error(`Clip command failed: ${interaction.commandName}`, error);

    const response: InteractionReplyOptions = {
      content: "Something went wrong while running that clip command.",
      flags: MessageFlags.Ephemeral
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(response);
    } else {
      await interaction.reply(response);
    }
  }
});

let shuttingDown = false;

async function shutdown(): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  await recorder.shutdown();
  client.destroy();
  process.exit(0);
}

process.once("SIGINT", () => {
  void shutdown();
});
process.once("SIGTERM", () => {
  void shutdown();
});

await client.login(clipEnv.token);
