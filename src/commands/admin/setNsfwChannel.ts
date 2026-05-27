import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { requirePermission } from "../../lib/permissions.js";
import { setNsfwChannel } from "../../services/nsfwSafety.js";
import type { SlashCommand } from "../../types/command.js";

export const setNsfwChannelCommand: SlashCommand = {
  category: "Admin",
  data: new SlashCommandBuilder()
    .setName("setnsfwchannel")
    .setDescription("Mark or unmark a channel as a preferred adult bot channel.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The adult-only text channel.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("enabled")
        .setDescription("Whether this is a preferred adult bot channel.")
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guildId || !(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) {
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    const enabled = interaction.options.getBoolean("enabled", true);

    setNsfwChannel(interaction.guildId, channel.id, enabled);

    await interaction.reply({
      content: enabled
        ? `${channel} is now marked as a preferred adult bot channel. Commands are not restricted to it.`
        : `${channel} is no longer marked as a preferred adult bot channel. Commands are still available server-wide.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
