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
import { getGuildConfig } from "./services/configStore.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const commandCollection = new Collection(commands.map((command) => [command.data.name, command]));

client.once(Events.ClientReady, (readyClient) => {
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

await client.login(env.token);
