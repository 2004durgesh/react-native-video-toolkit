import type { TimestampMap } from '../types';
import { normalizeText, readCues, splitBlocks, type RawCue } from './blocks';
import { parseTimestamp } from './timestamp';

const SKIPPED_BLOCKS = /^(NOTE|STYLE|REGION)(\s|$)/;

/** Reads `X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000`, in either order. */
const parseTimestampMap = (line: string): TimestampMap | undefined => {
  const value = line.slice(line.indexOf('=') + 1);
  let mpegts: number | undefined;
  let local: number | null = null;
  for (const part of value.split(',')) {
    const [key, ...rest] = part.split(':');
    const field = rest.join(':').trim();
    if (key?.trim().toUpperCase() === 'MPEGTS') mpegts = Number(field);
    else if (key?.trim().toUpperCase() === 'LOCAL') local = parseTimestamp(field);
  }
  return mpegts !== undefined && Number.isFinite(mpegts) && local !== null ? { mpegts, local } : undefined;
};

/** Reads cue settings, `align:start position:10%`. */
const parseSettings = (rest: string): Record<string, string> | undefined => {
  const settings: Record<string, string> = {};
  for (const pair of rest.split(/\s+/)) {
    const colon = pair.indexOf(':');
    if (colon > 0) settings[pair.slice(0, colon)] = pair.slice(colon + 1);
  }
  return Object.keys(settings).length > 0 ? settings : undefined;
};

/**
 * Reads a WebVTT file into cues as they are in the file. Blocks that aren't cues (`NOTE`, `STYLE`,
 * `REGION`) are skipped, and so are cues without a valid timing line. A missing `WEBVTT` header is
 * tolerated.
 * @internal
 */
export const parseVTTBlocks = (text: string): { cues: RawCue[]; skipped: number; timestampMap?: TimestampMap } => {
  const blocks = splitBlocks(normalizeText(text));
  const cues: RawCue[] = [];
  let skipped = 0;
  let timestampMap: TimestampMap | undefined;

  blocks.forEach((block, blockIndex) => {
    let lines = block;
    const first = lines[0] ?? '';
    const header = blockIndex === 0 && first.startsWith('WEBVTT');
    if (header || SKIPPED_BLOCKS.test(first)) {
      // A cue can follow the header or a note without a blank line: it starts at its timing line
      const cueAt = lines.findIndex((line, at) => at > 0 && line.includes('-->'));
      const own = cueAt === -1 ? lines : lines.slice(0, cueAt);
      // HLS segments put their timestamp map in the header
      const mapLine = header ? own.find((line) => line.startsWith('X-TIMESTAMP-MAP')) : undefined;
      if (mapLine) timestampMap = parseTimestampMap(mapLine);
      if (cueAt === -1) return;
      lines = lines.slice(cueAt);
    }

    const read = readCues(lines);
    if (!read) {
      skipped += 1;
      return;
    }
    for (const { rest, ...cue } of read) cues.push({ ...cue, settings: parseSettings(rest) });
  });

  return { cues, skipped, timestampMap };
};
