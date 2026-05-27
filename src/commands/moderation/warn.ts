import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { requirePermission } from "../../lib/permissions.js";
import { sendModLog } from "../../services/modLog.js";
import { addWarning } from "../../services/warnings.js";
import type { SlashCommand } from "../../types/command.js";

export const warnCommand: SlashCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user and record it locally.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to warn.").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Why this user is being warned.")
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guild || !(await requirePermission(interaction, PermissionFlagsBits.ModerateMembers))) {
      return;
    }

    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    const warning = await addWarning(interaction.guild.id, user.id, interaction.user.id, reason);

    await sendModLog({
      guild: interaction.guild,
      action: "User warned",
      moderator: interaction.user,
      target: user,
      reason,
      details: `Warning ID: ${warning.id}`
    });

    await interaction.reply({
      content: `${user.tag} was warned. Warning ID: ${warning.id}`
    });
  }
};
