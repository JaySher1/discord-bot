import { ChannelType, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { getDb, nowIso } from "./database.js";

const blockedTerms = [
  "underage",
  "minor",
  "child",
  "kid",
  "loli",
  "lolicon",
  "shota",
  "shotacon",
  "teen",
  "schoolgirl",
  "school boy",
  "schoolboy",
  "middle school",
  "high school",
  "imouto",
  "younger sister",
  "incest",
  "noncon",
  "non-consensual",
  "rape",
  "forced"
];

export function containsBlockedNsfwTerm(value: string): boolean {
  const normalized = value.toLowerCase();
  return blockedTerms.some((term) => normalized.includes(term));
}

export function assertSafeAdultText(value: string): string | null {
  if (containsBlockedNsfwTerm(value)) {
    return "That entry is blocked because it looks underage, ambiguous-age, incestuous, or non-consensual.";
  }

  return null;
}

export function setNsfwChannel(guildId: string, channelId: string, enabled: boolean): void {
  getDb()
    .prepare(
      `INSERT INTO nsfw_channels (guild_id, channel_id, enabled, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(guild_id, channel_id)
       DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at`
    )
    .run(guildId, channelId, enabled ? 1 : 0, nowIso());
}

export function isConfiguredNsfwChannel(guildId: string, channelId: string): boolean {
  const row = getDb()
    .prepare(
      `SELECT enabled FROM nsfw_channels
       WHERE guild_id = ? AND channel_id = ?`
    )
    .get(guildId, channelId) as { enabled: number } | undefined;

  return row?.enabled === 1;
}

export function isDiscordNsfwTextChannel(interaction: ChatInputCommandInteraction): boolean {
  return interaction.channel?.type === ChannelType.GuildText && interaction.channel.nsfw;
}

export async function requireNsfwChannel(
  interaction: ChatInputCommandInteraction
): Promise<boolean> {
  if (!interaction.guildId || !interaction.channelId) {
    await interaction.reply({
      content: "NSFW commands only work inside a server.",
      flags: MessageFlags.Ephemeral
    });
    return false;
  }

  if (
    isDiscordNsfwTextChannel(interaction) ||
    isConfiguredNsfwChannel(interaction.guildId, interaction.channelId)
  ) {
    return true;
  }

  await interaction.reply({
    content:
      "This command is locked to configured adult channels. Ask an admin to use /setnsfwchannel here first.",
    flags: MessageFlags.Ephemeral
  });

  return false;
}
