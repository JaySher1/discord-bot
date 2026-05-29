import "dotenv/config";

type Env = {
  token: string;
  clientId: string;
  guildId?: string;
  defaultWelcomeChannelId?: string;
  defaultLogChannelId?: string;
  youtubeCookie?: string;
  youtubeUserAgent?: string;
  port: number;
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

function optionalPort(name: string, fallback: number): number {
  const rawValue = optionalEnv(name);

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value <= 0 || value > 65_535) {
    throw new Error(`Invalid ${name}: expected a TCP port number`);
  }

  return value;
}

export const env: Env = {
  token: requiredEnv("DISCORD_TOKEN"),
  clientId: requiredEnv("DISCORD_CLIENT_ID"),
  guildId: optionalEnv("DISCORD_GUILD_ID"),
  defaultWelcomeChannelId: optionalEnv("DEFAULT_WELCOME_CHANNEL_ID"),
  defaultLogChannelId: optionalEnv("DEFAULT_LOG_CHANNEL_ID"),
  youtubeCookie: optionalEnv("YOUTUBE_COOKIE"),
  youtubeUserAgent: optionalEnv("YOUTUBE_USER_AGENT"),
  port: optionalPort("PORT", 8080)
};
