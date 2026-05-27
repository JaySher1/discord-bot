import {
  Client,
  Collection,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions
} from "discord.js";
import { commands } from "./commands/index.js";
import { env } from "./config/env.js";
import { recordCommandUse } from "./services/commandStats.js";
import { getGuildConfig } from "./services/configStore.js";
import { initializeDatabase } from "./services/database.js";
import { startHealthServer } from "./services/healthServer.js";
import { initializeMusicPlayer } from "./services/music/musicPlayer.js";

initializeDatabase();

let discordReady = false;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

await initializeMusicPlayer(client);

const commandCollection = new Collection(commands.map((command) => [command.data.name, command]));

const healthServer = startHealthServer({
  port: env.port,
  getStatus: () => ({
    discordReady,
    commandsLoaded: commands.length
  })
});

client.once(Events.ClientReady, (readyClient) => {
  discordReady = true;
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`Loaded ${commands.length} slash commands.`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  const config = await getGuildConfig(member.guild.id);

  if (!config.welcomeChannelId) {
    return;
  }

  const channel = await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);

  if (!channel?.isTextBased()) {
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Welcome to ${member.guild.name}!`)
    .setDescription(`Glad to have you here, ${member}. Make yourself at home.`)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  await channel.send({ embeds: [embed] });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandCollection.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: "I do not know that command yet.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    await command.execute(interaction as ChatInputCommandInteraction, client);
    recordCommandUse(interaction.guildId, interaction.user.id, interaction.commandName);
  } catch (error) {
    console.error(`Command failed: ${interaction.commandName}`, error);

    const response: InteractionReplyOptions = {
      content: "Something went wrong while running that command.",
      flags: MessageFlags.Ephemeral
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(response);
    } else {
      await interaction.reply(response);
    }
  }
});

function shutdown(): void {
  discordReady = false;
  client.destroy();
  healthServer.close(() => {
    process.exit(0);
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

await client.login(env.token);
