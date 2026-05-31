import "dotenv/config";

type ClipEnv = {
  token: string;
  clientId: string;
  guildId?: string;
  ffmpegPath: string;
};

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requiredEnv(name: string): string {
  const value = optionalEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const clipEnv: ClipEnv = {
  token: requiredEnv("CLIP_BOT_TOKEN"),
  clientId: requiredEnv("CLIP_BOT_CLIENT_ID"),
  guildId: optionalEnv("DISCORD_GUILD_ID"),
  ffmpegPath: optionalEnv("FFMPEG_PATH") ?? "ffmpeg"
};
