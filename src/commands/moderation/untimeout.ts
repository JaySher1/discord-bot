import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { requirePermission } from "../../lib/permissions.js";
import { sendModLog } from "../../services/modLog.js";
import type { SlashCommand } from "../../types/command.js";

export const untimeoutCommand: SlashCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove a member timeout.")
    .addUserOption((option) =>
      option.setName("member").setDescription("The member to remove timeout from.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why this timeout is being removed.")
    ),
  async execute(interaction) {
    if (
      !interaction.guild ||
      !(await requirePermission(interaction, PermissionFlagsBits.ModerateMembers))
    ) {
      return;
    }

    const user = interaction.options.getUser("member", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member?.moderatable) {
      await interaction.reply({
        content: "I cannot update that member. They may be above me in the role list.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await member.timeout(null, reason);
    await sendModLog({
      guild: interaction.guild,
      action: "Timeout removed",
      moderator: interaction.user,
      target: member,
      reason
    });

    await interaction.reply({ content: `${user.tag}'s timeout was removed.` });
  }
};
