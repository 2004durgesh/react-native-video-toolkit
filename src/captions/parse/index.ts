import type { CaptionFormat, Cue, ParseResult, TimestampMap } from '../types';
import { normalizeText, type RawCue } from './blocks';
import { parseSRTBlocks } from './srt';
import { isRTL, parseInline } from './text';
import { parseVTTBlocks } from './vtt';

/**
 * The format of a subtitle file's text: WebVTT if it starts with `WEBVTT`, SRT otherwise.
 */
export const detectCaptionFormat = (text: string): CaptionFormat =>
  normalizeText(text).trimStart().startsWith('WEBVTT') ? 'vtt' : 'srt';

const toCue = (raw: RawCue): Cue => {
  const spans = parseInline(raw.rawText);
  const text = spans.map((span) => span.text).join('');
  const cue: Cue = { start: raw.start, end: raw.end, text, spans, rtl: isRTL(text) };
  if (raw.id !== undefined) cue.id = raw.id;
  if (raw.settings) cue.settings = raw.settings;
  return cue;
};

/**
 * Parses a WebVTT or SRT file. Never throws: malformed cues are skipped, cues that end before they
 * start are dropped, and anything unreadable gives an empty track. Cues come back sorted by start,
 * with overlapping cues kept.
 *
 * @param text - The file's text.
 * @param format - The file's format; detected from the text when left out.
 */
export const parseCaptions = (text: string, format?: CaptionFormat): ParseResult => {
  try {
    const kind = format ?? detectCaptionFormat(text);
    const parsed: { cues: RawCue[]; skipped: number; timestampMap?: TimestampMap } =
      kind === 'vtt' ? parseVTTBlocks(text) : parseSRTBlocks(text);
    let skipped = parsed.skipped;
    const cues: Cue[] = [];
    // An exact repeat of a cue would show the same line twice
    const seen = new Set<string>();
    for (const raw of parsed.cues) {
      if (raw.end <= raw.start) {
        skipped += 1;
        continue;
      }
      const key = `${raw.start}|${raw.end}|${raw.rawText}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cues.push(toCue(raw));
    }
    if (__DEV__ && skipped > 0) {
      console.warn(`[react-native-video-toolkit] Skipped ${skipped} malformed subtitle cue(s).`);
    }
    // Stable, so cues that start together keep the file's order
    cues.sort((a, b) => a.start - b.start);
    const result: ParseResult = { cues, skipped };
    if (parsed.timestampMap) result.timestampMap = parsed.timestampMap;
    return result;
  } catch (error) {
    if (__DEV__) console.warn('[react-native-video-toolkit] Could not parse subtitles:', error);
    return { cues: [], skipped: 0 };
  }
};
