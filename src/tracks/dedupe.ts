import type { AudioTrack, TextTrack, VideoTrack } from 'react-native-video';

/**
 * Deduplicates video tracks:
 * - Groups by width, height, codecs.
 * - Keeps the highest bitrate in each group.
 */
export function dedupeVideoTracks<T extends VideoTrack>(tracks?: T[]): T[] {
  const map = new Map<string, T>();

  for (const track of tracks ?? []) {
    const signature = `${track.width}|${track.height}|${track.codecs}`;
    const existing = map.get(signature);

    if (!existing || track.bitrate! > existing.bitrate!) {
      map.set(signature, track);
    }
  }

  return Array.from(map.values());
}

/**
 * Deduplicates audio and text tracks: keeps the first track for each language and title, and drops
 * tracks without a language.
 */
export function dedupeLanguageTracks<T extends AudioTrack | TextTrack>(tracks?: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const track of tracks ?? []) {
    if (!track.language) continue;

    if (!seen.has(`${track.language}|${track.title}`)) {
      seen.add(`${track.language}|${track.title}`);
      result.push(track);
    }
  }

  return result;
}
