import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { updateGuildConfig } from "../../services/configStore.js";
import { requirePermission } from "../../lib/permissions.js";
import type { SlashCommand } from "../../types/command.js";

export const setWelcomeChannelCommand: SlashCommand = {
  category: "Admin",
  data: new SlashCommandBuilder()
    .setName("setwelcomechannel")
    .setDescription("Choose where welcome messages should be sent.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The text channel for welcome messages.")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guildId || !(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) {
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    await updateGuildConfig(interaction.guildId, { welcomeChannelId: channel.id });

    await interaction.reply({
      content: `Welcome messages will now go to ${channel}.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
