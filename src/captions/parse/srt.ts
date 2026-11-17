import { normalizeText, readCues, splitBlocks, type RawCue } from './blocks';

/**
 * Reads an SRT file into cues as they are in the file: an optional number line, a timing line
 * (`00:00:01,500 --> 00:00:03,000`, maybe followed by `X1:... Y1:...` coordinates, which are ignored)
 * and the text. Blocks without a valid timing line are skipped.
 * @internal
 */
export const parseSRTBlocks = (text: string): { cues: RawCue[]; skipped: number } => {
  const cues: RawCue[] = [];
  let skipped = 0;

  for (const lines of splitBlocks(normalizeText(text))) {
    const read = readCues(lines, true);
    if (!read) {
      skipped += 1;
      continue;
    }
    cues.push(...read);
  }

  return { cues, skipped };
};
