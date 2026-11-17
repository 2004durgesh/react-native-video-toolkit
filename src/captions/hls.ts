import { parseCaptions } from './parse';
import { fetchCaptionText } from './load';
import { CaptionLoadAborted, captionError, isCaptionError, describeError } from './errors';
import { resolveUrl } from './url';
import type { CaptionError, Cue, TimestampMap } from './types';

/**
 * A subtitle rendition listed in an HLS master playlist (`#EXT-X-MEDIA:TYPE=SUBTITLES`).
 */
export interface HlsSubtitleRendition {
  /** The rendition's media playlist, resolved against the master playlist. */
  uri: string;
  name: string;
  language?: string;
  /** Marked `DEFAULT=YES`: the stream's own pick. */
  default: boolean;
}

/** A WebVTT segment of a subtitle media playlist. Times in ms. @internal */
export interface HlsSegment {
  uri: string;
  start: number;
  duration: number;
}

/**
 * Reads an attribute list, `TYPE=SUBTITLES,NAME="English, CC",DEFAULT=YES`.
 * @internal
 */
export const parseAttributeList = (list: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  const pattern = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(list))) {
    const key = match[1];
    const value = match[2] ?? '';
    if (key) attributes[key] = value.startsWith('"') ? value.slice(1, -1) : value;
  }
  return attributes;
};

/**
 * Whether text is an HLS master playlist: it lists variant streams.
 * @internal
 */
export const isMasterPlaylist = (text: string) => text.includes('#EXT-X-STREAM-INF');

/**
 * The subtitle renditions of an HLS master playlist. A rendition listed under several groups is
 * returned once.
 */
export const parseMasterPlaylist = (text: string, baseUrl: string): HlsSubtitleRendition[] => {
  const renditions: HlsSubtitleRendition[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r\n?|\n/)) {
    if (!line.startsWith('#EXT-X-MEDIA:')) continue;
    const attributes = parseAttributeList(line.slice('#EXT-X-MEDIA:'.length));
    if (attributes.TYPE !== 'SUBTITLES' || !attributes.URI) continue;
    const uri = resolveUrl(baseUrl, attributes.URI);
    if (seen.has(uri)) continue;
    seen.add(uri);
    renditions.push({
      uri,
      name: attributes.NAME ?? attributes.LANGUAGE ?? 'Subtitles',
      language: attributes.LANGUAGE,
      default: attributes.DEFAULT === 'YES',
    });
  }
  return renditions;
};

/**
 * The segments of a subtitle media playlist, and whether it's a complete (VOD) playlist: one with
 * `#EXT-X-ENDLIST` or `#EXT-X-PLAYLIST-TYPE:VOD`. A live playlist keeps changing.
 */
export const parseMediaPlaylist = (text: string, baseUrl: string): { segments: HlsSegment[]; vod: boolean } => {
  const segments: HlsSegment[] = [];
  let vod = false;
  let duration: number | null = null;
  let start = 0;
  for (const raw of text.split(/\r\n?|\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      const seconds = parseFloat(line.slice('#EXTINF:'.length));
      duration = Number.isFinite(seconds) ? seconds * 1000 : 0;
    } else if (line === '#EXT-X-ENDLIST' || line === '#EXT-X-PLAYLIST-TYPE:VOD') {
      vod = true;
    } else if (!line.startsWith('#') && duration !== null) {
      segments.push({ uri: resolveUrl(baseUrl, line), start, duration });
      start += duration;
      duration = null;
    }
  }
  return { segments, vod };
};

/**
 * How far a segment's cue times are from media time, from its `X-TIMESTAMP-MAP`: the segment's
 * `LOCAL` time is the media's `MPEGTS` time (90 kHz).
 * @internal
 */
export const timestampOffset = (map: TimestampMap | undefined): number => (map ? map.mpegts / 90 - map.local : 0);

const cueKey = (cue: Cue) => `${cue.start}|${cue.end}|${cue.text}`;

/**
 * The subtitle renditions of an HLS stream, from its master playlist. A media playlist (a stream
 * with no variants) has none.
 * @internal
 */
export const loadHlsSubtitleRenditions = async (
  masterUrl: string,
  options: { headers?: Record<string, string>; signal?: AbortSignal } = {}
): Promise<HlsSubtitleRendition[]> => {
  const text = await fetchCaptionText(masterUrl, options);
  return isMasterPlaylist(text) ? parseMasterPlaylist(text, masterUrl) : [];
};

/** Whether a URL is an HLS playlist, by its `.m3u8` extension (a query string may follow). @internal */
export const isHlsUrl = (url: string) => /\.m3u8($|[?#])/i.test(url);

/** Segments fetched behind and ahead of the playhead. */
const WINDOW_BEHIND = 1;
const WINDOW_AHEAD = 3;
const CONCURRENCY = 2;

/** The rendition `createHlsSubtitleLoader` loads, and where it reports. @internal */
export interface HlsSubtitleLoaderOptions {
  /** The rendition's media playlist. */
  playlistUrl: string;
  headers?: Record<string, string>;
  /** Called with all the cues loaded so far, each time a segment adds some. */
  onCues: (cues: Cue[]) => void;
  /** Called once per failure: the playlist, a live playlist, or a segment. */
  onError: (error: CaptionError) => void;
}

/**
 * Loads an HLS subtitle rendition's WebVTT segments around the playhead. It fetches the media
 * playlist, then segment 0 to fix the timeline (its `X-TIMESTAMP-MAP` is media time 0), then the
 * segments around each time passed to `setTime`, two at a time. Cues repeated in the next segment
 * are kept once. Live playlists aren't supported.
 * @internal
 */
export const createHlsSubtitleLoader = (options: HlsSubtitleLoaderOptions) => {
  const { playlistUrl, headers, onCues, onError } = options;
  const controller = new AbortController();
  const fetchOptions = { headers, signal: controller.signal };
  let segments: HlsSegment[] | null = null;
  let baseline: number | null = null;
  const states = new Map<number, 'loading' | 'loaded' | 'failed'>();
  const cues = new Map<string, Cue>();
  let time = 0;
  let active = 0;
  let disposed = false;

  const report = (error: unknown) => {
    if (disposed || error instanceof CaptionLoadAborted) return;
    onError(isCaptionError(error) ? error : captionError('LOAD_FAILED', playlistUrl, describeError(error)));
  };

  const loadSegment = async (index: number) => {
    const segment = segments?.[index];
    if (!segment) return;
    states.set(index, 'loading');
    active += 1;
    try {
      const result = parseCaptions(await fetchCaptionText(segment.uri, fetchOptions), 'vtt');
      if (disposed) return;
      const offset = timestampOffset(result.timestampMap);
      if (baseline === null) baseline = offset;
      const shift = offset - baseline;
      let added = false;
      for (const cue of result.cues) {
        const shifted = shift === 0 ? cue : { ...cue, start: cue.start + shift, end: cue.end + shift };
        const key = cueKey(shifted);
        if (!cues.has(key)) {
          cues.set(key, shifted);
          added = true;
        }
      }
      states.set(index, 'loaded');
      if (added) onCues([...cues.values()]);
    } catch (error) {
      states.set(index, 'failed');
      report(error);
    } finally {
      active -= 1;
      if (!disposed) pump();
    }
  };

  /** Starts the next segments the playhead needs, keeping two loads at a time. */
  const pump = () => {
    if (!segments || disposed) return;
    // Segment 0 first: its timestamp map is the baseline for the others. If it fails, the first
    // segment that loads sets it (streams usually give every segment the same map).
    if (baseline === null && states.get(0) !== 'failed') {
      if (!states.has(0) && active === 0) loadSegment(0);
      return;
    }
    const at = segments.findIndex((segment) => time < segment.start + segment.duration);
    const current = at === -1 ? segments.length - 1 : at;
    const wanted: number[] = [current];
    for (let step = 1; step <= Math.max(WINDOW_AHEAD, WINDOW_BEHIND); step++) {
      if (step <= WINDOW_AHEAD) wanted.push(current + step);
      if (step <= WINDOW_BEHIND) wanted.push(current - step);
    }
    for (const index of wanted) {
      if (active >= CONCURRENCY) break;
      if (index >= 0 && index < segments.length && !states.has(index)) loadSegment(index);
    }
  };

  const start = async () => {
    try {
      const text = await fetchCaptionText(playlistUrl, fetchOptions);
      if (disposed) return;
      const playlist = parseMediaPlaylist(text, playlistUrl);
      if (!playlist.vod) {
        onError(captionError('UNSUPPORTED_FORMAT', playlistUrl, 'Live HLS subtitles are not supported'));
        return;
      }
      segments = playlist.segments;
      pump();
    } catch (error) {
      report(error);
    }
  };
  start();

  return {
    /** Loads the segments around a media time (ms). */
    setTime: (ms: number) => {
      time = ms;
      pump();
    },
    /** Cancels every load. */
    dispose: () => {
      disposed = true;
      controller.abort();
    },
  };
};

/** @internal */
export type HlsSubtitleLoader = ReturnType<typeof createHlsSubtitleLoader>;
