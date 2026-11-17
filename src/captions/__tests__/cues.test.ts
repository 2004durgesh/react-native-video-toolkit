import { createCueIndex } from '../cues';
import type { Cue } from '../types';

const cue = (start: number, end: number, text = `${start}-${end}`): Cue => ({
  start,
  end,
  text,
  spans: [{ text }],
  rtl: false,
});

const texts = (cues: Cue[]) => cues.map((c) => c.text);

describe('createCueIndex', () => {
  const index = createCueIndex([cue(5000, 6000, 'C'), cue(1000, 2000, 'A'), cue(2000, 3000, 'B')]);

  it('shows a cue from its start, inclusive, to its end, exclusive (SUB-SEL-01)', () => {
    expect(texts(index.activeAt(999))).toEqual([]);
    expect(texts(index.activeAt(1000))).toEqual(['A']);
    expect(texts(index.activeAt(1999))).toEqual(['A']);
    // Back to back: B replaces A at the same instant, with no gap (SUB-SEL-04)
    expect(texts(index.activeAt(2000))).toEqual(['B']);
  });

  it('shows nothing in gaps and after the last cue (SUB-SEL-02)', () => {
    expect(index.activeAt(4000)).toEqual([]);
    expect(index.activeAt(10_000)).toEqual([]);
  });

  it('finds the next boundary', () => {
    expect(index.nextBoundary(0)).toBe(1000);
    expect(index.nextBoundary(1500)).toBe(2000);
    expect(index.nextBoundary(3500)).toBe(5000);
    expect(index.nextBoundary(5500)).toBe(6000);
    expect(index.nextBoundary(6000)).toBeNull();
  });

  it('shows at most two overlapping cues, in start order (SUB-PARSE-07)', () => {
    const overlapping = createCueIndex([cue(0, 10_000, 'long'), cue(1000, 3000, 'one'), cue(2000, 4000, 'two')]);
    // The cues that started last win when more than two overlap
    expect(texts(overlapping.activeAt(2500))).toEqual(['one', 'two']);
    // A long cue still shows after later short cues have ended
    expect(texts(overlapping.activeAt(5000))).toEqual(['long']);
    expect(overlapping.nextBoundary(2500)).toBe(3000);
    expect(overlapping.nextBoundary(5000)).toBe(10_000);
  });

  it('handles an empty track', () => {
    const empty = createCueIndex([]);
    expect(empty.activeAt(0)).toEqual([]);
    expect(empty.nextBoundary(0)).toBeNull();
  });

  it('finds the cues of a large track without going through it', () => {
    // Counts how often the index reads a cue's times
    let reads = 0;
    const counted = (start: number, end: number): Cue => ({
      ...cue(start, end),
      get start() {
        reads += 1;
        return start;
      },
      get end() {
        reads += 1;
        return end;
      },
    });
    const many = createCueIndex(Array.from({ length: 20_000 }, (_, i) => counted(i * 1000, i * 1000 + 900)));
    reads = 0;
    expect(texts(many.activeAt(12_345_500))).toEqual(['12345000-12345900']);
    expect(many.nextBoundary(12_345_500)).toBe(12_345_900);
    // A search reads a few dozen cues; going through the track would read thousands
    expect(reads).toBeLessThan(100);
  });
});
