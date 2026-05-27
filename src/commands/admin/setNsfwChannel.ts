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
    .setDescription("Allow or block adult waifu commands in a channel.")
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
        .setDescription("Whether adult commands are allowed there.")
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
        ? `${channel} is now allowed for adult waifu commands.`
        : `${channel} is no longer allowed for adult waifu commands.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
