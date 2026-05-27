export const YOUTUBE_UNSUPPORTED_MESSAGE = "YouTube is not supported in this version.";

const youtubeHostPattern = /(^|\.)((youtube\.com)|(youtu\.be)|(youtube-nocookie\.com)|(music\.youtube\.com))$/i;

export function isYouTubeUrl(input: string): boolean {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    return youtubeHostPattern.test(url.hostname);
  } catch {
    return /\b(?:youtube\.com|youtu\.be|music\.youtube\.com)\b/i.test(trimmed);
  }
}
