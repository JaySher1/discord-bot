import { getDb, nowIso } from "./database.js";

export function recordCommandUse(
  guildId: string | null,
  userId: string,
  commandName: string
): void {
  if (!guildId) {
    return;
  }

  getDb()
    .prepare(
      `INSERT INTO command_stats (guild_id, user_id, command_name, count, last_used_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(guild_id, user_id, command_name)
       DO UPDATE SET count = count + 1, last_used_at = excluded.last_used_at`
    )
    .run(guildId, userId, commandName, nowIso());
}

export function getSimpboard(guildId: string): Array<{ userId: string; count: number }> {
  return getDb()
    .prepare(
      `SELECT user_id as userId, SUM(count) as count
       FROM command_stats
       WHERE guild_id = ?
         AND command_name IN ('waifu', 'claim', 'collection', 'trade', 'gooncheck', 'bonk')
       GROUP BY user_id
       ORDER BY count DESC
       LIMIT 10`
    )
    .all(guildId) as Array<{ userId: string; count: number }>;
}
