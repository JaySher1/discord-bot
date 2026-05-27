import type { GuildQueue, Track } from "discord-player";

const UNKNOWN_DURATION = "unknown duration";

export function formatTrack(track: Track): string {
  const duration = track.live ? "live" : track.duration || UNKNOWN_DURATION;
  const title = track.title || "Untitled track";

  if (track.url) {
    return `[${title}](${track.url}) (${duration})`;
  }

  return `${title} (${duration})`;
}

export function formatQueue(queue: GuildQueue, limit = 10): string {
  const currentTrack = queue.currentTrack;
  const upcomingTracks = queue.tracks.toArray().slice(0, limit);
  const lines: string[] = [];

  if (currentTrack) {
    lines.push(`Now playing: ${formatTrack(currentTrack)}`);
  }

  if (upcomingTracks.length === 0) {
    lines.push("Queue is empty after the current track.");
    return lines.join("\n");
  }

  lines.push(
    "",
    "Up next:",
    ...upcomingTracks.map((track, index) => `${index + 1}. ${formatTrack(track)}`)
  );

  const hiddenCount = queue.tracks.size - upcomingTracks.length;

  if (hiddenCount > 0) {
    lines.push(`...and ${hiddenCount} more.`);
  }

  return lines.join("\n");
}

export function formatNowPlaying(queue: GuildQueue): string {
  const currentTrack = queue.currentTrack;

  if (!currentTrack) {
    return "Nothing is playing right now.";
  }

  const timestamp = queue.node.getTimestamp();
  const progress = timestamp ? `${timestamp.current.label} / ${timestamp.total.label}` : currentTrack.duration;
  const source = currentTrack.source ? `Source: ${String(currentTrack.source)}` : "Source: unknown";
  const requester = currentTrack.requestedBy ? `Requested by: ${currentTrack.requestedBy}` : "Requested by: unknown";

  return [`Now playing: ${formatTrack(currentTrack)}`, `Progress: ${progress}`, source, requester].join("\n");
}
