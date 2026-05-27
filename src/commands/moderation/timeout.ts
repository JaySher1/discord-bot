import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { requirePermission } from "../../lib/permissions.js";
import { sendModLog } from "../../services/modLog.js";
import type { SlashCommand } from "../../types/command.js";

const minute = 60_000;

export const timeoutCommand: SlashCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member for a number of minutes.")
    .addUserOption((option) =>
      option.setName("member").setDescription("The member to timeout.").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("How long the timeout should last.")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why this member is being timed out.")
    ),
  async execute(interaction) {
    if (
      !interaction.guild ||
      !(await requirePermission(interaction, PermissionFlagsBits.ModerateMembers))
    ) {
      return;
    }

    const user = interaction.options.getUser("member", true);
    const minutes = interaction.options.getInteger("minutes", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member?.moderatable) {
      await interaction.reply({
        content: "I cannot timeout that member. They may be above me in the role list.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await member.timeout(minutes * minute, reason);
    await sendModLog({
      guild: interaction.guild,
      action: "Member timed out",
      moderator: interaction.user,
      target: member,
      reason,
      details: `${minutes} minute(s)`
    });

    await interaction.reply({ content: `${user.tag} was timed out for ${minutes} minute(s).` });
  }
};
