/**
 * A run of a cue's text with one style, from its `<b>`, `<i>` and `<u>` tags.
 */
export interface CueSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/**
 * One subtitle cue. Times are in milliseconds of media time.
 */
export interface Cue {
  /** The cue's identifier line, if the file has one. */
  id?: string;
  /** When the cue appears, inclusive. */
  start: number;
  /** When it disappears, exclusive. */
  end: number;
  /** The text without tags, with line breaks kept. */
  text: string;
  /** The text split by style. */
  spans: CueSpan[];
  /** Whether the text reads right to left, from its first letter. */
  rtl: boolean;
}

/**
 * The `X-TIMESTAMP-MAP` header of an HLS WebVTT segment: the segment's `LOCAL` time (ms) is the
 * media's `MPEGTS` time (90 kHz ticks).
 */
export interface TimestampMap {
  mpegts: number;
  local: number;
}

/** What parsing a subtitle file gives. */
export interface ParseResult {
  /** Valid cues, sorted by start. Overlapping cues are kept. */
  cues: Cue[];
  /** How many blocks were dropped as malformed or with `end <= start`. */
  skipped: number;
  /** The WebVTT `X-TIMESTAMP-MAP` header, in HLS segments. */
  timestampMap?: TimestampMap;
}

/** The subtitle file formats the toolkit reads. */
export type CaptionFormat = 'vtt' | 'srt';

/** Why loading or parsing subtitles failed. */
export type CaptionErrorCode = 'LOAD_FAILED' | 'TIMEOUT' | 'PARSE_FAILED' | 'UNSUPPORTED_FORMAT';

/**
 * A subtitle error, passed to `config.onCaptionError`. The video keeps playing without subtitles.
 */
export interface CaptionError {
  code: CaptionErrorCode;
  /** The subtitle file or playlist that failed. */
  url: string;
  /** What went wrong, for logs. */
  reason: string;
}

export type { CaptionFile, CaptionTrack } from '../tracks/types';
