import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  type Client,
  type Message,
  type SendableChannels
} from "discord.js";
import type { Track, UnresolvedTrack } from "lavalink-client";
import { getLavalinkManager } from "./lavalink.js";

export const MUSIC_CONTROL_IDS = {
  pause: "music:pause",
  skip: "music:skip",
  shuffle: "music:shuffle",
  stop: "music:stop"
} as const;

type MusicControlId = (typeof MUSIC_CONTROL_IDS)[keyof typeof MUSIC_CONTROL_IDS];

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

  const player = getLavalinkManager().getPlayer(guildId);
  const message = await channel.send({
    content: `Now playing: **${track.info.title}**`,
    embeds: [buildTrackEmbed(track, "Now Playing")],
    components: [buildControlsRow(Boolean(player?.queue.current), Boolean(player?.paused))]
  });

  activeControlMessages.set(guildId, message.id);
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

export async function handleMusicButtonInteraction(interaction: ButtonInteraction): Promise<boolean> {
  if (!isMusicControlId(interaction.customId)) {
    return false;
  }

  await interaction.deferUpdate().catch(() => null);

  const guild = interaction.guild;

  if (!guild || interaction.user.bot) {
    return true;
  }

  if (activeControlMessages.get(guild.id) !== interaction.message.id) {
    return true;
  }

  const botMember = guild.members.me ?? (await guild.members.fetchMe().catch(() => null));
  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  const botVoiceChannelId = botMember?.voice.channelId;

  if (!botVoiceChannelId || member?.voice.channelId !== botVoiceChannelId) {
    return true;
  }

  const lavalink = getLavalinkManager();
  const player = lavalink.getPlayer(guild.id);

  if (!player?.queue.current) {
    clearNowPlayingControl(guild.id);
    await setControlsDisabled(interaction.message).catch(() => null);
    return true;
  }

  try {
    switch (interaction.customId) {
      case MUSIC_CONTROL_IDS.pause:
        if (player.paused) {
          await player.resume();
        } else {
          await player.pause();
        }
        break;
      case MUSIC_CONTROL_IDS.skip:
        await player.skip();
        break;
      case MUSIC_CONTROL_IDS.shuffle:
        if (player.queue.tracks.length > 1) {
          await player.queue.shuffle();
        }
        break;
      case MUSIC_CONTROL_IDS.stop:
        await player.destroy("stopped by button");
        clearNowPlayingControl(guild.id);
        break;
      default:
        break;
    }
  } catch (error: unknown) {
    console.error(`Could not process music button ${interaction.customId} in guild ${guild.id}`, error);
  }

  const latestPlayer = lavalink.getPlayer(guild.id);

  if (!latestPlayer?.queue.current) {
    await setControlsDisabled(interaction.message).catch(() => null);
    return true;
  }

  await interaction.message
    .edit({
      components: [buildControlsRow(Boolean(latestPlayer.queue.current), Boolean(latestPlayer.paused))]
    })
    .catch(() => null);

  return true;
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

function buildControlsRow(hasTrack: boolean, isPaused: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MUSIC_CONTROL_IDS.pause)
      .setStyle(ButtonStyle.Primary)
      .setEmoji(isPaused ? "▶️" : "⏸️")
      .setDisabled(!hasTrack),
    new ButtonBuilder()
      .setCustomId(MUSIC_CONTROL_IDS.skip)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⏭️")
      .setDisabled(!hasTrack),
    new ButtonBuilder()
      .setCustomId(MUSIC_CONTROL_IDS.shuffle)
      .setStyle(ButtonStyle.Success)
      .setEmoji("🔀")
      .setDisabled(!hasTrack),
    new ButtonBuilder()
      .setCustomId(MUSIC_CONTROL_IDS.stop)
      .setStyle(ButtonStyle.Danger)
      .setEmoji("⏹️")
      .setDisabled(!hasTrack)
  );
}

async function setControlsDisabled(message: Message): Promise<void> {
  await message.edit({
    components: [buildControlsRow(false, false)]
  });
}

function isMusicControlId(customId: string): customId is MusicControlId {
  return (
    customId === MUSIC_CONTROL_IDS.pause ||
    customId === MUSIC_CONTROL_IDS.skip ||
    customId === MUSIC_CONTROL_IDS.shuffle ||
    customId === MUSIC_CONTROL_IDS.stop
  );
}
