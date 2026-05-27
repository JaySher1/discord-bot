import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "bot.sqlite");

let db: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
  if (!db) {
    mkdirSync(dataDir, { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA foreign_keys = ON;");
  }

  return db;
}

export function initializeDatabase(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS waifus (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      url TEXT NOT NULL,
      source TEXT,
      tags TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      is_nsfw INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_waifus_provider_id
      ON waifus(provider, provider_id);

    CREATE TABLE IF NOT EXISTS claims (
      guild_id TEXT NOT NULL,
      waifu_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      claimed_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, waifu_id),
      FOREIGN KEY (waifu_id) REFERENCES waifus(id)
    );

    CREATE INDEX IF NOT EXISTS idx_claims_owner
      ON claims(guild_id, owner_id);

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      proposer_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      offered_waifu_id TEXT NOT NULL,
      requested_waifu_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (offered_waifu_id) REFERENCES waifus(id),
      FOREIGN KEY (requested_waifu_id) REFERENCES waifus(id)
    );

    CREATE TABLE IF NOT EXISTS tier_votes (
      guild_id TEXT NOT NULL,
      tier_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      option_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, tier_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Unranked Degenerate',
      favorite_waifu_id TEXT,
      trade_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id),
      FOREIGN KEY (favorite_waifu_id) REFERENCES waifus(id)
    );

    CREATE TABLE IF NOT EXISTS nsfw_channels (
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, channel_id)
    );

    CREATE TABLE IF NOT EXISTS command_stats (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      command_name TEXT NOT NULL,
      count INTEGER NOT NULL,
      last_used_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id, command_name)
    );

    CREATE TABLE IF NOT EXISTS last_pulls (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      waifu_id TEXT NOT NULL,
      pulled_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id),
      FOREIGN KEY (waifu_id) REFERENCES waifus(id)
    );
  `);
}

export function nowIso(): string {
  return new Date().toISOString();
}
