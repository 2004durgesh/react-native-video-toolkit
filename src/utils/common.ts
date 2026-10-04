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
 * Deduplicates video (quality) tracks:
 * - Groups by label, since react-native-video v7 exposes no resolution or bitrate per track.
 * - Keeps the first occurrence of each label.
 */
export function dedupeVideoTracks<T extends VideoTrack>(tracks?: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const track of tracks ?? []) {
    if (!seen.has(track.label)) {
      seen.add(track.label);
      result.push(track);
    }
  }

  return result;
}

/**
 * Deduplicates audio/text tracks:
 * - Groups by language and label.
 * - Keeps the first occurrence of each group.
 * - Keeps tracks without a language (external subtitles may omit it).
 */
export function dedupeLanguageTracks<T extends AudioTrack | TextTrack>(tracks?: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const track of tracks ?? []) {
    const signature = `${track.language ?? ''}|${track.label}`;

    if (!seen.has(signature)) {
      seen.add(signature);
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
