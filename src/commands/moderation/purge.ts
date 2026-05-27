import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { requirePermission } from "../../lib/permissions.js";
import { sendModLog } from "../../services/modLog.js";
import type { SlashCommand } from "../../types/command.js";

export const purgeCommand: SlashCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete recent messages from this channel.")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete, from 1 to 100.")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why these messages are being deleted.")
    ),
  async execute(interaction) {
    if (!interaction.guild || !(await requirePermission(interaction, PermissionFlagsBits.ManageMessages))) {
      return;
    }

    if (interaction.channel?.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: "Purge can only be used in a regular text channel.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const amount = interaction.options.getInteger("amount", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const deleted = await interaction.channel.bulkDelete(amount, true);

    await sendModLog({
      guild: interaction.guild,
      action: "Messages purged",
      moderator: interaction.user,
      reason,
      details: `${deleted.size} message(s) deleted in #${interaction.channel.name}`
    });

    await interaction.reply({
      content: `Deleted ${deleted.size} message(s).`,
      flags: MessageFlags.Ephemeral
    });
  }
};
