import { LavalinkManager, type SearchPlatform } from "lavalink-client";
import type { Client } from "discord.js";
import { env } from "../config/env.js";

let lavalink: LavalinkManager | null = null;

export function createLavalinkManager(client: Client): LavalinkManager {
  const config = getLavalinkConfig();

  lavalink = new LavalinkManager({
    nodes: [
      {
        id: "main",
        host: config.host,
        port: config.port,
        authorization: config.password,
        secure: config.secure
      }
    ],
    sendToShard: (guildId, payload) => {
      client.guilds.cache.get(guildId)?.shard?.send(payload);
    },
    autoSkip: true,
    playerOptions: {
      defaultSearchPlatform: "ytsearch",
      onEmptyQueue: {
        destroyAfterMs: 30_000
      },
      onDisconnect: {
        autoReconnect: true,
        destroyPlayer: false
      }
    },
    client: {
      id: env.clientId,
      username: client.user?.username ?? "Discord Bot"
    }
  });

  lavalink.nodeManager.on("connect", (node) => {
    console.log(`Lavalink node connected: ${node.id}`);
  });

  lavalink.nodeManager.on("error", (node, error) => {
    console.error(`Lavalink node error: ${node.id}`, error);
  });

  lavalink.on("trackError", (player, track, payload) => {
    console.error(`Lavalink track error in guild ${player.guildId}: ${track?.info.title ?? "unknown track"}`, payload);
  });

  lavalink.on("trackStuck", (player, track, payload) => {
    console.error(`Lavalink track stuck in guild ${player.guildId}: ${track?.info.title ?? "unknown track"}`, payload);
  });

  return lavalink;
}

export function getLavalinkManager(): LavalinkManager {
  if (!lavalink) {
    throw new Error("Lavalink is not initialized yet. Restart the bot after configuring Lavalink.");
  }

  return lavalink;
}

export function getSearchSource(input: string): SearchPlatform {
  const url = normalizeUrl(input);

  if (!url) {
    return "ytsearch";
  }

  if (isSpotifyUrl(url)) {
    throw new Error("Spotify links are not supported. Use a YouTube or SoundCloud link instead.");
  }

  if (isYouTubeUrl(url) || isSoundCloudUrl(url)) {
    return "link";
  }

  throw new Error("That link is not a supported YouTube video or SoundCloud track.");
}

function getLavalinkConfig(): {
  host: string;
  port: number;
  password: string;
  secure: boolean;
} {
  if (!env.lavalinkHost) {
    throw new Error("Missing required environment variable: LAVALINK_HOST");
  }

  if (!env.lavalinkPassword) {
    throw new Error("Missing required environment variable: LAVALINK_PASSWORD");
  }

  return {
    host: env.lavalinkHost,
    port: env.lavalinkPort ?? 2333,
    password: env.lavalinkPassword,
    secure: env.lavalinkSecure
  };
}

function normalizeUrl(input: string): string | null {
  try {
    const url = new URL(input);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

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
