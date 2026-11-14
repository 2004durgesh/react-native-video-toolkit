import type { Cue } from './types';

/**
 * Finds the cues on screen at a media time.
 */
export interface CueIndex {
  /** The cues, sorted by start. */
  readonly cues: readonly Cue[];
  /**
   * The cues showing at `time` (ms): those with `start <= time < end`, in start order. When more
   * than `max` overlap, the `max` that started last.
   */
  activeAt: (time: number, max?: number) => Cue[];
  /**
   * The next time after `time` when a cue starts or ends, or `null` if none does.
   */
  nextBoundary: (time: number) => number | null;
}

/** How many overlapping cues show at once. */
export const DEFAULT_MAX_VISIBLE_CUES = 2;

/**
 * Indexes cues for lookups by time: a binary search on the starts, then a scan back that stops
 * once no earlier cue can still be showing (tracked with the running maximum of the ends).
 *
 * @param input - Cues in any order; they're sorted by start.
 */
export const createCueIndex = (input: readonly Cue[]): CueIndex => {
  const cues = [...input].sort((a, b) => a.start - b.start);
  const maxEndSoFar: number[] = [];
  let runningMax = -Infinity;
  for (const cue of cues) {
    runningMax = Math.max(runningMax, cue.end);
    maxEndSoFar.push(runningMax);
  }

  /** The index of the first cue starting after `time`. */
  const firstStartAfter = (time: number): number => {
    let low = 0;
    let high = cues.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if ((cues[mid]?.start ?? Infinity) <= time) low = mid + 1;
      else high = mid;
    }
    return low;
  };

  /** Every cue showing at `time`, latest start first. */
  const showingAt = (time: number): Cue[] => {
    const showing: Cue[] = [];
    for (let i = firstStartAfter(time) - 1; i >= 0 && (maxEndSoFar[i] ?? -Infinity) > time; i--) {
      const cue = cues[i];
      if (cue && cue.end > time) showing.push(cue);
    }
    return showing;
  };

  return {
    cues,
    activeAt: (time, max = DEFAULT_MAX_VISIBLE_CUES) => showingAt(time).slice(0, max).reverse(),
    nextBoundary: (time) => {
      // A cue that isn't showing and ends later must also start later, so the next boundary is the
      // next start or the earliest end of the cues showing now
      let next = cues[firstStartAfter(time)]?.start ?? Infinity;
      for (const cue of showingAt(time)) next = Math.min(next, cue.end);
      return Number.isFinite(next) ? next : null;
    },
  };
};
