import { parseTimingLine } from './timestamp';

/**
 * A cue as it is in the file, before its text is parsed and its timing checked.
 * @internal
 */
export interface RawCue {
  id?: string;
  start: number;
  end: number;
  rawText: string;
}

/**
 * The file's text without a byte-order mark or NUL characters, and with `\n` line endings (it may
 * use `\r\n` or `\r`).
 * @internal
 */
export const normalizeText = (text: string): string =>
  text
    .replace(/^\uFEFF/, '')
    .split('\u0000')
    .join('')
    .replace(/\r\n?/g, '\n');

const DIGITS = /^\d+$/;

/**
 * Reads the cues of one block. Usually that's one cue: an optional identifier line, the timing line
 * and the text. A block can hold more when the blank line between cues is missing, so every line
 * that is a valid timing line starts a new cue, as in browsers.
 *
 * @param numberedIds - SRT: a number line just before a cue's timing line is its number, not the
 *   previous cue's text.
 * @returns The cues and the rest of each timing line (its settings), or `null` if the block has
 *   no valid timing line.
 * @internal
 */
export const readCues = (lines: string[], numberedIds = false): (RawCue & { rest: string })[] | null => {
  const timings: { at: number; start: number; end: number; rest: string }[] = [];
  lines.forEach((line, at) => {
    if (!line.includes('-->')) return;
    const timing = parseTimingLine(line);
    if (timing) timings.push({ at, ...timing });
  });
  if (timings.length === 0) return null;

  const numberAbove = (at: number) => numberedIds && at > 0 && DIGITS.test(lines[at - 1]?.trim() ?? '');
  return timings.map((timing, k) => {
    const next = timings[k + 1];
    // The first cue's identifier is the line above its timing line at the top of the block; later
    // ones only have a number, in SRT
    let id: string | undefined;
    if (k === 0 ? timing.at === 1 : numberAbove(timing.at)) id = lines[timing.at - 1]?.trim();
    const textEnd = next ? next.at - (numberAbove(next.at) && next.at - 1 > timing.at ? 1 : 0) : lines.length;
    return {
      id,
      start: timing.start,
      end: timing.end,
      rest: timing.rest,
      rawText: lines.slice(timing.at + 1, textEnd).join('\n'),
    };
  });
};

/**
 * Splits text into blocks separated by blank lines (lines with only spaces count as blank).
 * @internal
 */
export const splitBlocks = (text: string): string[][] => {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '') {
      if (current.length > 0) blocks.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
};
