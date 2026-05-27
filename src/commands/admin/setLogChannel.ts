import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { requirePermission } from "../../lib/permissions.js";
import { updateGuildConfig } from "../../services/configStore.js";
import type { SlashCommand } from "../../types/command.js";

export const setLogChannelCommand: SlashCommand = {
  category: "Admin",
  data: new SlashCommandBuilder()
    .setName("setlogchannel")
    .setDescription("Choose where moderation logs should be sent.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The text channel for moderation logs.")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guildId || !(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) {
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    await updateGuildConfig(interaction.guildId, { logChannelId: channel.id });

    await interaction.reply({
      content: `Moderation logs will now go to ${channel}.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
