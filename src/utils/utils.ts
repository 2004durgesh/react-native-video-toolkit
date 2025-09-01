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
