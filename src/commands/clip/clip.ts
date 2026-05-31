import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type Client
} from "discord.js";
import { requirePermission } from "../../lib/permissions.js";
import type { ClipRecorder } from "../../services/clipRecorder.js";

export const clipCommand = new SlashCommandBuilder()
  .setName("clip")
  .setDescription("Record short voice clips from the current voice channel.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("enable")
      .setDescription("Start the rolling voice clip buffer.")
      .addIntegerOption((option) =>
        option
          .setName("seconds")
          .setDescription("Clip length in seconds. Defaults to 30, max 60.")
          .setMinValue(1)
          .setMaxValue(60)
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Channel where saved clips are uploaded.")
          .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement
          )
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("save")
      .setDescription("Save the current voice clip buffer.")
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Optional clip title.")
          .setMaxLength(80)
      )
  )
  .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show clip bot status."))
  .addSubcommand((subcommand) => subcommand.setName("stop").setDescription("Stop clipping and leave voice."));

export async function executeClipCommand(
  interaction: ChatInputCommandInteraction,
  client: Client,
  recorder: ClipRecorder
): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "enable":
      await handleEnable(interaction, client, recorder);
      break;
    case "save":
      await handleSave(interaction, recorder);
      break;
    case "status":
      await handleStatus(interaction, recorder);
      break;
    case "stop":
      await handleStop(interaction, recorder);
      break;
    default:
      await interaction.reply({
        content: "Unknown clip subcommand.",
        flags: MessageFlags.Ephemeral
      });
      break;
  }
}

async function handleEnable(
  interaction: ChatInputCommandInteraction,
  client: Client,
  recorder: ClipRecorder
): Promise<void> {
  if (!interaction.guild || !(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) {
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content: "Join a voice channel first, then run `/clip enable` again.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const selectedChannel = interaction.options.getChannel("channel", true);
  const outputChannel = await client.channels.fetch(selectedChannel.id).catch(() => null);

  if (!outputChannel?.isSendable()) {
    await interaction.reply({
      content: "I need a channel where I can send clip messages and attachments.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const seconds = interaction.options.getInteger("seconds") ?? 30;
  const result = await recorder.enable({
    guild: interaction.guild,
    client,
    voiceChannel,
    outputChannel,
    seconds,
    requestedByUserId: interaction.user.id
  });

  await interaction.reply({
    content: result.message,
    flags: result.ephemeral ? MessageFlags.Ephemeral : undefined
  });
}

async function handleSave(interaction: ChatInputCommandInteraction, recorder: ClipRecorder): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Use `/clip save` inside a server.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const title = interaction.options.getString("title")?.trim() || undefined;
  const result = await recorder.save(interaction.guild, interaction.user.id, title);

  await interaction.editReply(result.message);
}

async function handleStatus(interaction: ChatInputCommandInteraction, recorder: ClipRecorder): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Use `/clip status` inside a server.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.reply({
    content: recorder.getStatus(interaction.guild.id),
    flags: MessageFlags.Ephemeral
  });
}

async function handleStop(interaction: ChatInputCommandInteraction, recorder: ClipRecorder): Promise<void> {
  if (!interaction.guild || !(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) {
    return;
  }

  const message = await recorder.stop(interaction.guild.id);

  await interaction.reply({
    content: message,
    flags: MessageFlags.Ephemeral
  });
}
