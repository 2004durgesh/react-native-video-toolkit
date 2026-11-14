import { Image } from 'react-native';
import { parseCaptions, detectCaptionFormat } from './parse';
import { decodeCaptionBytes } from './decode';
import { CaptionLoadAborted, captionError, describeError, isCaptionError } from './errors';
import type { CaptionFormat, ParseResult } from './types';

/**
 * Where a subtitle file comes from: a URL (`https://`, `file://`), or a bundled file from
 * `require('./subtitles.vtt')`.
 */
export type CaptionSource = string | number;

/** How to fetch a subtitle file. @internal */
export interface FetchCaptionOptions {
  /** Request headers, such as an `Authorization` token. */
  headers?: Record<string, string>;
  /** How long to wait for the file. @default 10000 */
  timeoutMs?: number;
  /** Cancels the load. */
  signal?: AbortSignal;
}

/** The default time to wait for a subtitle file or playlist. */
export const DEFAULT_CAPTION_TIMEOUT = 10_000;

/**
 * The URL of a subtitle source: a bundled file's from React Native's asset registry.
 * @internal
 */
export const resolveCaptionUri = (source: CaptionSource): string | null => {
  if (typeof source === 'string') return source;
  const resolve = (Image as { resolveAssetSource?: (asset: number) => { uri?: string } | null }).resolveAssetSource;
  return resolve?.(source)?.uri ?? null;
};

/**
 * Fetches a URL's bytes, failing with a `CaptionError` (`TIMEOUT`, or `LOAD_FAILED` for a network
 * error or an HTTP error status) or `CaptionLoadAborted`.
 * @internal
 */
export const fetchCaptionBytes = async (url: string, options: FetchCaptionOptions = {}): Promise<Uint8Array> => {
  const { headers, timeoutMs = DEFAULT_CAPTION_TIMEOUT, signal } = options;
  if (signal?.aborted) throw new CaptionLoadAborted();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) throw captionError('LOAD_FAILED', url, `HTTP ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    // Judged by what was cancelled, not by the error's name: fetch implementations name it differently
    if (signal?.aborted) throw new CaptionLoadAborted();
    if (timedOut) throw captionError('TIMEOUT', url, `No response within ${timeoutMs} ms`);
    if (isCaptionError(error)) throw error;
    throw captionError('LOAD_FAILED', url, describeError(error));
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
};

/**
 * Fetches a URL as text, decoded with `decodeCaptionBytes`.
 * @internal
 */
export const fetchCaptionText = async (
  url: string,
  options: FetchCaptionOptions & { encoding?: string } = {}
): Promise<string> => decodeCaptionBytes(await fetchCaptionBytes(url, options), options.encoding);

const cache = new Map<string, ParseResult>();

/** @internal Clears the parsed-file cache, for tests. */
export const clearCaptionCache = () => cache.clear();

/**
 * Loads and parses a subtitle file, once per URL: later loads of the same URL reuse the cues.
 * Fails with a `CaptionError`: `LOAD_FAILED`, `TIMEOUT`, `UNSUPPORTED_FORMAT` (not WebVTT or SRT,
 * such as TTML or an HTML error page) or `PARSE_FAILED` (a file with text but no valid cue).
 * @internal
 */
export const loadCaptionFile = async (
  source: CaptionSource,
  options: FetchCaptionOptions & { encoding?: string; format?: CaptionFormat } = {}
): Promise<ParseResult> => {
  const url = resolveCaptionUri(source);
  if (!url) throw captionError('LOAD_FAILED', String(source), 'The bundled file could not be resolved');
  const cached = cache.get(url);
  if (cached) return cached;

  const text = await fetchCaptionText(url, options);
  const content = text.trimStart();
  if (content.startsWith('<')) {
    throw captionError('UNSUPPORTED_FORMAT', url, 'Not a WebVTT or SRT file (XML or HTML)');
  }
  const result = parseCaptions(text, options.format ?? detectCaptionFormat(text));
  if (result.cues.length === 0 && result.skipped > 0) {
    throw captionError('PARSE_FAILED', url, `No valid cue in ${result.skipped} block(s)`);
  }
  cache.set(url, result);
  return result;
};
