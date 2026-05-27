import { getDb, nowIso } from "./database.js";
import type { WaifuImage } from "./waifuApi.js";

export type StoredWaifu = {
  id: string;
  provider: string;
  providerId: string;
  url: string;
  source?: string | null;
  tags: string[];
  width?: number | null;
  height?: number | null;
  isNsfw: boolean;
};

export type ClaimedWaifu = StoredWaifu & {
  ownerId: string;
  claimedAt: string;
};

type WaifuRow = {
  id: string;
  provider: string;
  provider_id: string;
  url: string;
  source: string | null;
  tags: string;
  width: number | null;
  height: number | null;
  is_nsfw: number;
};

type ClaimRow = WaifuRow & {
  owner_id: string;
  claimed_at: string;
};

type TradeRow = {
  id: string;
  guild_id: string;
  proposer_id: string;
  target_id: string;
  offered_waifu_id: string;
  requested_waifu_id: string;
};

function mapWaifu(row: WaifuRow): StoredWaifu {
  return {
    id: row.id,
    provider: row.provider,
    providerId: row.provider_id,
    url: row.url,
    source: row.source,
    tags: JSON.parse(row.tags) as string[],
    width: row.width,
    height: row.height,
    isNsfw: row.is_nsfw === 1
  };
}

function mapClaim(row: ClaimRow): ClaimedWaifu {
  return {
    ...mapWaifu(row),
    ownerId: row.owner_id,
    claimedAt: row.claimed_at
  };
}

export function saveWaifu(image: WaifuImage): StoredWaifu {
  getDb()
    .prepare(
      `INSERT INTO waifus (id, provider, provider_id, url, source, tags, width, height, is_nsfw, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id)
       DO UPDATE SET url = excluded.url, source = excluded.source, tags = excluded.tags`
    )
    .run(
      image.id,
      image.provider,
      image.providerId,
      image.url,
      image.source ?? null,
      JSON.stringify(image.tags),
      image.width ?? null,
      image.height ?? null,
      image.isNsfw ? 1 : 0,
      nowIso()
    );

  return getWaifu(image.id) as StoredWaifu;
}

export function getWaifu(waifuId: string): StoredWaifu | null {
  const row = getDb()
    .prepare("SELECT * FROM waifus WHERE id = ?")
    .get(waifuId) as WaifuRow | undefined;

  return row ? mapWaifu(row) : null;
}

export function rememberLastPull(guildId: string, userId: string, waifuId: string): void {
  getDb()
    .prepare(
      `INSERT INTO last_pulls (guild_id, user_id, waifu_id, pulled_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(guild_id, user_id)
       DO UPDATE SET waifu_id = excluded.waifu_id, pulled_at = excluded.pulled_at`
    )
    .run(guildId, userId, waifuId, nowIso());
}

export function getLastPull(guildId: string, userId: string): StoredWaifu | null {
  const row = getDb()
    .prepare(
      `SELECT w.*
       FROM last_pulls lp
       JOIN waifus w ON w.id = lp.waifu_id
       WHERE lp.guild_id = ? AND lp.user_id = ?`
    )
    .get(guildId, userId) as WaifuRow | undefined;

  return row ? mapWaifu(row) : null;
}

export function getClaim(guildId: string, waifuId: string): ClaimedWaifu | null {
  const row = getDb()
    .prepare(
      `SELECT w.*, c.owner_id, c.claimed_at
       FROM claims c
       JOIN waifus w ON w.id = c.waifu_id
       WHERE c.guild_id = ? AND c.waifu_id = ?`
    )
    .get(guildId, waifuId) as ClaimRow | undefined;

  return row ? mapClaim(row) : null;
}

export function claimWaifu(
  guildId: string,
  waifuId: string,
  ownerId: string
): { ok: true; claim: ClaimedWaifu } | { ok: false; existing: ClaimedWaifu } {
  const existing = getClaim(guildId, waifuId);

  if (existing) {
    return { ok: false, existing };
  }

  getDb()
    .prepare(
      `INSERT INTO claims (guild_id, waifu_id, owner_id, claimed_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(guildId, waifuId, ownerId, nowIso());

  ensureProfile(guildId, ownerId);
  return { ok: true, claim: getClaim(guildId, waifuId) as ClaimedWaifu };
}

export function getCollection(
  guildId: string,
  ownerId: string,
  limit = 10,
  offset = 0
): ClaimedWaifu[] {
  const rows = getDb()
    .prepare(
      `SELECT w.*, c.owner_id, c.claimed_at
       FROM claims c
       JOIN waifus w ON w.id = c.waifu_id
       WHERE c.guild_id = ? AND c.owner_id = ?
       ORDER BY c.claimed_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(guildId, ownerId, limit, offset) as ClaimRow[];

  return rows.map(mapClaim);
}

export function countCollection(guildId: string, ownerId: string): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) as total
       FROM claims
       WHERE guild_id = ? AND owner_id = ?`
    )
    .get(guildId, ownerId) as { total: number } | undefined;

  return row?.total ?? 0;
}

export function releaseWaifu(guildId: string, ownerId: string, waifuId: string): boolean {
  const result = getDb()
    .prepare(
      `DELETE FROM claims
       WHERE guild_id = ? AND owner_id = ? AND waifu_id = ?`
    )
    .run(guildId, ownerId, waifuId);

  return result.changes > 0;
}

export function createTrade(
  guildId: string,
  proposerId: string,
  targetId: string,
  offeredWaifuId: string,
  requestedWaifuId: string
): string {
  const tradeId = crypto.randomUUID();

  getDb()
    .prepare(
      `INSERT INTO trades
       (id, guild_id, proposer_id, target_id, offered_waifu_id, requested_waifu_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`
    )
    .run(tradeId, guildId, proposerId, targetId, offeredWaifuId, requestedWaifuId, nowIso());

  return tradeId;
}

export function completeTrade(tradeId: string): boolean {
  const database = getDb();
  const trade = database
    .prepare(
      `SELECT * FROM trades
       WHERE id = ? AND status = 'pending'`
    )
    .get(tradeId) as TradeRow | undefined;

  if (!trade) {
    return false;
  }

  const offeredClaim = getClaim(trade.guild_id, trade.offered_waifu_id);
  const requestedClaim = getClaim(trade.guild_id, trade.requested_waifu_id);

  if (
    offeredClaim?.ownerId !== trade.proposer_id ||
    requestedClaim?.ownerId !== trade.target_id
  ) {
    database
      .prepare("UPDATE trades SET status = 'failed', resolved_at = ? WHERE id = ?")
      .run(nowIso(), tradeId);
    return false;
  }

  database.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    database
      .prepare("UPDATE claims SET owner_id = ? WHERE guild_id = ? AND waifu_id = ?")
      .run(trade.target_id, trade.guild_id, trade.offered_waifu_id);
    database
      .prepare("UPDATE claims SET owner_id = ? WHERE guild_id = ? AND waifu_id = ?")
      .run(trade.proposer_id, trade.guild_id, trade.requested_waifu_id);
    database
      .prepare("UPDATE trades SET status = 'accepted', resolved_at = ? WHERE id = ?")
      .run(nowIso(), tradeId);
    database
      .prepare(
        `INSERT INTO user_profiles (guild_id, user_id, trade_count, updated_at)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(guild_id, user_id)
         DO UPDATE SET trade_count = trade_count + 1, updated_at = excluded.updated_at`
      )
      .run(trade.guild_id, trade.proposer_id, nowIso());
    database
      .prepare(
        `INSERT INTO user_profiles (guild_id, user_id, trade_count, updated_at)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(guild_id, user_id)
         DO UPDATE SET trade_count = trade_count + 1, updated_at = excluded.updated_at`
      )
      .run(trade.guild_id, trade.target_id, nowIso());
    database.exec("COMMIT;");
    return true;
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  }
}

export function cancelTrade(tradeId: string): void {
  getDb()
    .prepare("UPDATE trades SET status = 'declined', resolved_at = ? WHERE id = ?")
    .run(nowIso(), tradeId);
}

export function ensureProfile(guildId: string, userId: string): void {
  getDb()
    .prepare(
      `INSERT INTO user_profiles (guild_id, user_id, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO NOTHING`
    )
    .run(guildId, userId, nowIso());
}

export function getProfile(guildId: string, userId: string): {
  title: string;
  tradeCount: number;
  claimCount: number;
} {
  ensureProfile(guildId, userId);

  const profile = getDb()
    .prepare(
      `SELECT title, trade_count as tradeCount
       FROM user_profiles
       WHERE guild_id = ? AND user_id = ?`
    )
    .get(guildId, userId) as { title: string; tradeCount: number } | undefined;

  return {
    title: profile?.title ?? "Unranked Degenerate",
    tradeCount: profile?.tradeCount ?? 0,
    claimCount: countCollection(guildId, userId)
  };
}
