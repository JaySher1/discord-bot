import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { requirePermission } from "../../lib/permissions.js";
import { sendModLog } from "../../services/modLog.js";
import type { SlashCommand } from "../../types/command.js";

export const banCommand: SlashCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to ban.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why this user is being banned.")
    )
    .addIntegerOption((option) =>
      option
        .setName("delete_messages")
        .setDescription("How many previous message days to delete, from 0 to 7.")
        .setMinValue(0)
        .setMaxValue(7)
    ),
  async execute(interaction) {
    if (!interaction.guild || !(await requirePermission(interaction, PermissionFlagsBits.BanMembers))) {
      return;
    }

    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const deleteMessageSeconds =
      (interaction.options.getInteger("delete_messages") ?? 0) * 24 * 60 * 60;

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !member.bannable) {
      await interaction.reply({
        content: "I cannot ban that member. They may be above me in the role list.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.guild.members.ban(user.id, { reason, deleteMessageSeconds });
    await sendModLog({
      guild: interaction.guild,
      action: "User banned",
      moderator: interaction.user,
      target: user,
      reason
    });

    await interaction.reply({ content: `${user.tag} was banned. Reason: ${reason}` });
  }
};
