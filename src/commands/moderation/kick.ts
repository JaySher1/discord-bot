import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { requirePermission } from "../../lib/permissions.js";
import { sendModLog } from "../../services/modLog.js";
import type { SlashCommand } from "../../types/command.js";

export const kickCommand: SlashCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server.")
    .addUserOption((option) =>
      option.setName("member").setDescription("The member to kick.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why this member is being kicked.")
    ),
  async execute(interaction) {
    if (!interaction.guild || !(await requirePermission(interaction, PermissionFlagsBits.KickMembers))) {
      return;
    }

    const user = interaction.options.getUser("member", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member?.kickable) {
      await interaction.reply({
        content: "I cannot kick that member. They may be above me or no longer in the server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await member.kick(reason);
    await sendModLog({
      guild: interaction.guild,
      action: "Member kicked",
      moderator: interaction.user,
      target: member,
      reason
    });

    await interaction.reply({ content: `${user.tag} was kicked. Reason: ${reason}` });
  }
};
