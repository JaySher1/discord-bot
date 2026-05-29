import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  type AudioPlayer,
  type DiscordGatewayAdapterCreator,
  type VoiceConnection
} from "@discordjs/voice";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import play from "play-dl";
import type { SoundCloudTrack } from "play-dl";
import { env } from "../../config/env.js";
import type { SlashCommand } from "../../types/command.js";

type PlayStream = Awaited<ReturnType<typeof play.stream>>;

type ResolvedTrack = {
  source: "YouTube" | "SoundCloud";
  title: string;
  url: string;
  stream: PlayStream;
};

type MusicSession = {
  connection: VoiceConnection;
  player: AudioPlayer;
};

const musicSessions = new Map<string, MusicSession>();
let youtubeSetup = false;
let soundCloudSetup: Promise<void> | null = null;

export const playCommand: SlashCommand = {
  category: "Music",
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a YouTube search, YouTube link, or SoundCloud track.")
    .addStringOption((option) =>
      option.setName("song").setDescription("Song name, YouTube URL, or SoundCloud URL.").setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply("Use `/play` inside a server so I can join your voice channel.");
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    const voiceChannel = member?.voice.channel;

    if (!voiceChannel) {
      await interaction.reply("Join a voice channel first, then run `/play` again.");
      return;
    }

    const botMember = interaction.guild.members.me ?? (await interaction.guild.members.fetchMe());
    const voicePermissions = voiceChannel.permissionsFor(botMember);

    if (
      !voiceChannel.joinable ||
      !voicePermissions?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])
    ) {
      await interaction.reply("I can see your voice channel, but I do not have permission to join and speak there.");
      return;
    }

    const query = interaction.options.getString("song", true).trim();
    await interaction.reply(`Searching for **${query}**...`);

    try {
      const track = await resolveTrack(query);
      const existingConnection = getVoiceConnection(interaction.guild.id);

      if (existingConnection && existingConnection.joinConfig.channelId !== voiceChannel.id) {
        existingConnection.destroy();
      }

      const connection =
        existingConnection?.joinConfig.channelId === voiceChannel.id
          ? existingConnection
          : joinVoiceChannel({
              channelId: voiceChannel.id,
              guildId: interaction.guild.id,
              adapterCreator: interaction.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
              selfDeaf: true
            });

      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

      const oldSession = musicSessions.get(interaction.guild.id);
      oldSession?.player.stop(true);

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });
      const resource = createAudioResource(track.stream.stream, {
        inputType: toDiscordStreamType(track.stream.type),
        metadata: {
          title: track.title
        }
      });

      player.on(AudioPlayerStatus.Idle, () => {
        const activeSession = musicSessions.get(interaction.guild?.id ?? "");
        if (activeSession?.player === player) {
          activeSession.connection.destroy();
          musicSessions.delete(interaction.guild?.id ?? "");
        }
      });

      player.on("error", (error) => {
        console.error("Music playback failed", error);
        interaction
          .followUp("Playback stopped because Discord could not play that audio stream cleanly.")
          .catch(() => undefined);
      });

      const subscription = connection.subscribe(player);

      if (!subscription) {
        connection.destroy();
        throw new Error("I joined the channel, but Discord did not accept the audio player.");
      }

      musicSessions.set(interaction.guild.id, { connection, player });
      player.play(resource);
      await entersState(player, AudioPlayerStatus.Playing, 20_000);

      await interaction.editReply(`Now playing **${track.title}** from ${track.source}.\n${track.url}`);
    } catch (error) {
      console.error("Play command failed", error);
      cleanupGuildSession(interaction.guild.id);
      await interaction.editReply(`I could not play that. ${toPublicPlayError(error)}`);
    }
  }
};

async function resolveTrack(input: string): Promise<ResolvedTrack> {
  if (!input) {
    throw new Error("Give me a song name, YouTube URL, or SoundCloud URL.");
  }

  const normalizedUrl = normalizeUrl(input);

  if (normalizedUrl) {
    if (isSpotifyUrl(normalizedUrl)) {
      throw new Error("Spotify links are not supported. Use a YouTube or SoundCloud link instead.");
    }

    if (isYouTubeUrl(normalizedUrl)) {
      return resolveYouTubeUrl(normalizedUrl);
    }

    if (isSoundCloudUrl(normalizedUrl)) {
      return resolveSoundCloudUrl(normalizedUrl);
    }

    throw new Error("That link is not a supported YouTube video or SoundCloud track.");
  }

  ensureYouTubeReady();

  const results = await play.search(input, {
    limit: 1,
    source: {
      youtube: "video"
    }
  });
  const video = results[0];

  if (!video) {
    throw new Error("I could not find a matching YouTube result.");
  }

  return resolveYouTubeUrl(video.url);
}

async function resolveYouTubeUrl(url: string): Promise<ResolvedTrack> {
  ensureYouTubeReady();

  const validation = play.yt_validate(url);

  if (validation === "playlist") {
    throw new Error("YouTube playlists are not supported yet. Send one video link or a song name.");
  }

  if (validation !== "video") {
    throw new Error("That does not look like a playable YouTube video link.");
  }

  const info = await play.video_basic_info(url);
  const stream = await play.stream_from_info(info);

  return {
    source: "YouTube",
    title: info.video_details.title ?? "YouTube video",
    url: info.video_details.url,
    stream
  };
}

function ensureYouTubeReady(): void {
  if (youtubeSetup) {
    return;
  }

  youtubeSetup = true;

  if (!env.youtubeCookie && !env.youtubeUserAgent) {
    return;
  }

  play.setToken({
    youtube: env.youtubeCookie
      ? {
          cookie: env.youtubeCookie
        }
      : undefined,
    useragent: env.youtubeUserAgent ? [env.youtubeUserAgent] : undefined
  });
}

async function resolveSoundCloudUrl(url: string): Promise<ResolvedTrack> {
  await ensureSoundCloudReady();

  const validation = await play.so_validate(url);

  if (validation === "playlist") {
    throw new Error("SoundCloud playlists are not supported yet. Send one track link.");
  }

  if (validation !== "track") {
    throw new Error("That does not look like a playable SoundCloud track link.");
  }

  const track = await play.soundcloud(url);

  if (!isSoundCloudTrack(track)) {
    throw new Error("SoundCloud playlists are not supported yet. Send one track link.");
  }

  const stream = await play.stream_from_info(track);

  return {
    source: "SoundCloud",
    title: track.name,
    url: track.permalink,
    stream
  };
}

async function ensureSoundCloudReady(): Promise<void> {
  soundCloudSetup ??= play
    .getFreeClientID()
    .then((clientId) =>
      play.setToken({
        soundcloud: {
          client_id: clientId
        }
      })
    )
    .catch((error: unknown) => {
      soundCloudSetup = null;
      throw error;
    });

  await soundCloudSetup;
}

function normalizeUrl(input: string): string | null {
  try {
    const url = new URL(input);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

function isYouTubeUrl(url: string): boolean {
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === "youtu.be" || hostname.endsWith(".youtube.com") || hostname === "youtube.com";
}

function isSoundCloudUrl(url: string): boolean {
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === "snd.sc" || hostname.endsWith(".soundcloud.com") || hostname === "soundcloud.com";
}

function isSpotifyUrl(url: string): boolean {
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname.endsWith(".spotify.com") || hostname === "spotify.com";
}

function isSoundCloudTrack(track: Awaited<ReturnType<typeof play.soundcloud>>): track is SoundCloudTrack {
  return track.type === "track";
}

function toPublicPlayError(error: unknown): string {
  const message = error instanceof Error ? error.message : "That track could not be played.";

  if (isYouTubeBotChallenge(message)) {
    return [
      "YouTube is asking the server to sign in to confirm it is not a bot.",
      "Add a fresh `YOUTUBE_COOKIE` environment variable on the host, then restart the bot.",
      "You can still try a SoundCloud track while YouTube is blocking the server."
    ].join(" ");
  }

  return message;
}

function isYouTubeBotChallenge(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("sign in to confirm") ||
    normalized.includes("confirm you're not a bot") ||
    normalized.includes("confirm you are not a bot") ||
    normalized.includes("captcha page") ||
    normalized.includes("youtube has detected that you are a bot")
  );
}

function toDiscordStreamType(type: PlayStream["type"]): StreamType {
  switch (String(type)) {
    case "ogg/opus":
      return StreamType.OggOpus;
    case "opus":
      return StreamType.Opus;
    case "raw":
      return StreamType.Raw;
    case "webm/opus":
      return StreamType.WebmOpus;
    default:
      return StreamType.Arbitrary;
  }
}

function cleanupGuildSession(guildId: string): void {
  const session = musicSessions.get(guildId);
  session?.player.stop(true);
  session?.connection.destroy();
  musicSessions.delete(guildId);
}
