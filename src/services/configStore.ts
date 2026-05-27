import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export type GuildConfig = {
  welcomeChannelId?: string;
  logChannelId?: string;
};

type ConfigFile = Record<string, GuildConfig>;

const configPath = path.join(process.cwd(), "data", "guild-config.json");

async function readConfigFile(): Promise<ConfigFile> {
  try {
    const raw = await readFile(configPath, "utf8");
    return JSON.parse(raw) as ConfigFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeConfigFile(config: ConfigFile): Promise<void> {
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  const config = await readConfigFile();
  const guildConfig = config[guildId] ?? {};

  return {
    welcomeChannelId: guildConfig.welcomeChannelId ?? env.defaultWelcomeChannelId,
    logChannelId: guildConfig.logChannelId ?? env.defaultLogChannelId
  };
}

export async function updateGuildConfig(
  guildId: string,
  patch: Partial<GuildConfig>
): Promise<GuildConfig> {
  const config = await readConfigFile();
  const nextConfig = {
    ...(config[guildId] ?? {}),
    ...patch
  };

  config[guildId] = nextConfig;
  await writeConfigFile(config);

  return nextConfig;
}
