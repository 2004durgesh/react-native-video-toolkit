import type { AudioTrack, VideoTrack, TextTrack } from 'react-native-video';

export const combineHandlers =
  <T extends (...args: any[]) => void>(...handlers: (T | undefined)[]) =>
  (...args: Parameters<T>) => {
    handlers.forEach((handler) => {
      if (typeof handler === 'function') {
        handler(...args);
      }
    });
  };

/**
 * Deduplicates video tracks:
 * - Groups by width, height, codecs.
 * - Keeps the highest bitrate in each group.
 */
export function dedupeVideoTracks<T extends VideoTrack>(tracks: T[]): T[] {
  const map = new Map<string, T>();

  for (const track of tracks) {
    const signature = `${track.width}|${track.height}|${track.codecs}`;
    const existing = map.get(signature);

    if (!existing || track.bitrate! > existing.bitrate!) {
      map.set(signature, track);
    }
  }

  return Array.from(map.values());
}

/**
 * Deduplicates audio/text tracks:
 * - Groups by language.
 * - Keeps the first occurrence of each language.
 * - Filters out tracks with null/undefined language.
 */
export function dedupeLanguageTracks<T extends AudioTrack | TextTrack>(tracks: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const track of tracks) {
    if (!track.language) continue;

    if (!seen.has(`${track.language}|${track.title}`)) {
      seen.add(`${track.language}|${track.title}`);
      result.push(track);
    }
  }

  return result;
}

/**
 * Convert HEX + alpha to RGBA string
 * @param hex - hex color (#RRGGBB or #RGB)
 * @param alpha - opacity (0 to 1)
 * @returns rgba(r,g,b,a)
 */
export function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace('#', '');

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
