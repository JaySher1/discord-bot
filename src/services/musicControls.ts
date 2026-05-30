import {
  EmbedBuilder,
  type Client,
  type Message,
  type MessageReaction,
  type PartialMessageReaction,
  type PartialUser,
  type SendableChannels,
  type User
} from "discord.js";
import type { Track, UnresolvedTrack } from "lavalink-client";
import { getLavalinkManager } from "./lavalink.js";

export const SKIP_REACTION = "⏭️";

const activeControlMessages = new Map<string, string>();

export async function sendNowPlayingMessage(
  client: Client,
  guildId: string,
  channelId: string | undefined | null,
  track: Track | null
): Promise<void> {
  if (!track || !channelId) {
    activeControlMessages.delete(guildId);
    return;
  }

  const channel = await fetchSendableChannel(client, channelId);

  if (!channel) {
    return;
  }

  const message = await channel.send({
    content: `Now playing **${track.info.title}** from ${formatSource(track.info.sourceName ?? "Lavalink")}.`,
    embeds: [buildTrackEmbed(track, "Now Playing")]
  });

  activeControlMessages.set(guildId, message.id);
  await message.react(SKIP_REACTION).catch((error: unknown) => {
    console.error(`Could not add skip reaction to message ${message.id}`, error);
    void channel.send(
      "I could not add the skip reaction. Give me `Add Reactions` and `Read Message History` in this channel, then restart the song."
    );
  });
}

export async function sendMusicMessage(
  client: Client,
  channelId: string | undefined | null,
  content: string
): Promise<void> {
  const channel = await fetchSendableChannel(client, channelId);

  if (!channel) {
    return;
  }

  await channel.send(content).catch((error: unknown) => {
    console.error(`Could not send music message to channel ${channelId}`, error);
  });
}

export async function handleMusicReaction(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
): Promise<void> {
  if (user.partial) {
    await user.fetch().catch(() => null);
  }

  if (user.bot || reaction.emoji.name !== SKIP_REACTION) {
    return;
  }

  const message = await fetchReactionMessage(reaction);
  const guild = message.guild;

  if (!guild || activeControlMessages.get(guild.id) !== message.id) {
    return;
  }

  const lavalink = getLavalinkManager();
  const player = lavalink.getPlayer(guild.id);

  if (!player?.queue.current) {
    activeControlMessages.delete(guild.id);
    return;
  }

  const botMember = guild.members.me ?? (await guild.members.fetchMe().catch(() => null));
  const member = await guild.members.fetch(user.id).catch(() => null);
  const botVoiceChannelId = botMember?.voice.channelId;

  if (!botVoiceChannelId || member?.voice.channelId !== botVoiceChannelId) {
    return;
  }

  await player.skip().catch((error: unknown) => {
    console.error(`Could not skip track in guild ${guild.id}`, error);
  });
}

export function clearNowPlayingControl(guildId: string): void {
  activeControlMessages.delete(guildId);
}

export function buildTrackEmbed(track: Track | UnresolvedTrack, title: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(track.info.title)
    .setDescription(`${track.info.author ? `${track.info.author}\n` : ""}${formatDuration(track.info.duration)}`)
    .addFields({ name: "Source", value: formatSource(track.info.sourceName ?? "Lavalink"), inline: true })
    .setTimestamp();

  if (track.info.uri) {
    embed.setURL(track.info.uri);
  }

  if (track.info.artworkUrl) {
    embed.setThumbnail(track.info.artworkUrl);
  }

  embed.setFooter({ text: title });
  return embed;
}

export function formatQueueLine(track: Track | UnresolvedTrack, index: number): string {
  const requester = formatRequester(track.requester);
  return `${index}. **${truncate(track.info.title, 90)}** - ${formatDuration(track.info.duration)}${
    requester ? ` - requested by ${requester}` : ""
  }`;
}

export function formatDuration(duration: number | undefined): string {
  if (!duration || duration <= 0) {
    return "Live or unknown length";
  }

  const totalSeconds = Math.floor(duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatSource(source: string): string {
  switch (source.toLowerCase()) {
    case "youtube":
      return "YouTube";
    case "soundcloud":
      return "SoundCloud";
    default:
      return source;
  }
}

async function fetchSendableChannel(
  client: Client,
  channelId: string | undefined | null
): Promise<SendableChannels | null> {
  if (!channelId) {
    return null;
  }

  const channel = client.channels.cache.get(channelId) ?? (await client.channels.fetch(channelId).catch(() => null));

  if (!channel?.isSendable()) {
    return null;
  }

  return channel;
}

async function fetchReactionMessage(reaction: MessageReaction | PartialMessageReaction): Promise<Message> {
  if (reaction.partial) {
    await reaction.fetch();
  }

  if (reaction.message.partial) {
    await reaction.message.fetch();
  }

  return reaction.message as Message;
}

function formatRequester(requester: unknown): string | null {
  if (!requester || typeof requester !== "object") {
    return null;
  }

  if ("id" in requester && typeof requester.id === "string") {
    return `<@${requester.id}>`;
  }

  if ("username" in requester && typeof requester.username === "string") {
    return requester.username;
  }

  return null;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}
