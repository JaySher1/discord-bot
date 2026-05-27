import {
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type GuildMember
} from "discord.js";

export function memberHasPermission(
  interaction: ChatInputCommandInteraction,
  permission: bigint
): boolean {
  const member = interaction.member as GuildMember | null;
  return member?.permissions.has(permission) ?? false;
}

export async function requirePermission(
  interaction: ChatInputCommandInteraction,
  permission: bigint = PermissionFlagsBits.ModerateMembers
): Promise<boolean> {
  if (memberHasPermission(interaction, permission)) {
    return true;
  }

  await interaction.reply({
    content: "You do not have permission to use this command.",
    flags: MessageFlags.Ephemeral
  });

  return false;
}
