import "dotenv/config";

type Env = {
  token: string;
  clientId: string;
  guildId?: string;
  defaultWelcomeChannelId?: string;
  defaultLogChannelId?: string;
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

export const env: Env = {
  token: requiredEnv("DISCORD_TOKEN"),
  clientId: requiredEnv("DISCORD_CLIENT_ID"),
  guildId: optionalEnv("DISCORD_GUILD_ID"),
  defaultWelcomeChannelId: optionalEnv("DEFAULT_WELCOME_CHANNEL_ID"),
  defaultLogChannelId: optionalEnv("DEFAULT_LOG_CHANNEL_ID")
};
