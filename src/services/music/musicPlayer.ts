import { createRequire } from "node:module";
import { Player, QueryType, GuildQueueEvent, type GuildQueue, type PlayerNodeInitializationResult } from "discord-player";
import { AttachmentExtractor, SoundCloudExtractor } from "@discord-player/extractor";
import type { User, VoiceBasedChannel } from "discord.js";

export type MusicQueueMetadata = {
  textChannelId: string;
  requestedById: string;
};

let musicPlayer: Player | null = null;

type PlayerClient = ConstructorParameters<typeof Player>[0];
type PlayerVoiceChannel = Parameters<Player["play"]>[0];
type PlayerPlayOptions = NonNullable<Parameters<Player["play"]>[2]>;

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static") as string | null;

function isUrl(input: string): boolean {
  try {
    new URL(input.trim());
    return true;
  } catch {
    return false;
  }
}

export async function initializeMusicPlayer(client: unknown): Promise<Player> {
  if (musicPlayer) {
    return musicPlayer;
  }

  const player = new Player(client as PlayerClient, {
    ffmpegPath: ffmpegPath ?? undefined
  });

  await player.extractors.register(SoundCloudExtractor, {});
  await player.extractors.register(AttachmentExtractor, {});

  player.events.on(GuildQueueEvent.PlayerError, (queue, error, track) => {
    console.error(`Music playback failed in guild ${queue.guild.id} for ${track.title}:`, error);
  });

  player.events.on(GuildQueueEvent.Error, (queue, error) => {
    console.error(`Music queue failed in guild ${queue.guild.id}:`, error);
  });

  player.on("error", (error) => {
    console.error("Music player failed:", error);
  });

  musicPlayer = player;
  return player;
}

export function getMusicPlayer(): Player {
  if (!musicPlayer) {
    throw new Error("Music player has not been initialized.");
  }

  return musicPlayer;
}

export function getGuildQueue(guildId: string): GuildQueue<MusicQueueMetadata> | null {
  return getMusicPlayer().nodes.get<MusicQueueMetadata>(guildId);
}

export async function playMusicQuery(options: {
  voiceChannel: VoiceBasedChannel;
  query: string;
  requestedBy: User;
  textChannelId: string;
}): Promise<PlayerNodeInitializationResult<MusicQueueMetadata>> {
  const searchEngine = isUrl(options.query) ? QueryType.AUTO : QueryType.SOUNDCLOUD_SEARCH;

  return getMusicPlayer().play<MusicQueueMetadata>(options.voiceChannel as unknown as PlayerVoiceChannel, options.query, {
    requestedBy: options.requestedBy as unknown as PlayerPlayOptions["requestedBy"],
    searchEngine,
    connectionOptions: {
      deaf: true
    },
    nodeOptions: {
      metadata: {
        textChannelId: options.textChannelId,
        requestedById: options.requestedBy.id
      },
      leaveOnEmpty: true,
      leaveOnEmptyCooldown: 60_000,
      leaveOnEnd: true,
      leaveOnEndCooldown: 60_000,
      leaveOnStop: true,
      leaveOnStopCooldown: 5_000,
      selfDeaf: true
    }
  });
}
