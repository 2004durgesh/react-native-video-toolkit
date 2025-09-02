export const combineHandlers =
  <T extends (...args: any[]) => void>(...handlers: (T | undefined)[]) =>
  (...args: Parameters<T>) => {
    handlers.forEach((handler) => {
      if (typeof handler === 'function') {
        handler(...args);
      }
    });
  };

type Track = Record<string, any>;

/**
 * Deduplicates a list of tracks based on specified unique keys.
 * Keeps the first occurrence and removes the rest.
 */
export function dedupeTracks<T extends Track>(tracks: T[], keys: (keyof T)[]): T[] {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    const signature = keys.map((k) => String(track[k])).join('|');
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
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
