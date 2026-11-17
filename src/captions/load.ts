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
  /** Cancels the load. */
  signal?: AbortSignal;
}

/** How long to wait for a subtitle file or playlist. */
const TIMEOUT = 10_000;

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
  const { headers, signal } = options;
  if (signal?.aborted) throw new CaptionLoadAborted();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) throw captionError('LOAD_FAILED', url, `HTTP ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    // Judged by what was cancelled, not by the error's name: fetch implementations name it differently
    if (signal?.aborted) throw new CaptionLoadAborted();
    if (timedOut) throw captionError('TIMEOUT', url, `No response within ${TIMEOUT} ms`);
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
export const fetchCaptionText = async (url: string, options: FetchCaptionOptions = {}): Promise<string> =>
  decodeCaptionBytes(await fetchCaptionBytes(url, options));

// Parsed files by URL and format, the most recent last; the oldest go past the limit
const cache = new Map<string, ParseResult>();
const CACHE_LIMIT = 20;

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
  options: FetchCaptionOptions & { format?: CaptionFormat } = {}
): Promise<ParseResult> => {
  const url = resolveCaptionUri(source);
  if (!url) throw captionError('LOAD_FAILED', String(source), 'The bundled file could not be resolved');
  const key = `${options.format ?? ''}|${url}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const text = await fetchCaptionText(url, options);
  const content = text.trimStart();
  if (content.startsWith('<')) {
    throw captionError('UNSUPPORTED_FORMAT', url, 'Not a WebVTT or SRT file (XML or HTML)');
  }
  let result: ParseResult;
  try {
    result = parseCaptions(text, options.format ?? detectCaptionFormat(text));
  } catch (error) {
    throw captionError('PARSE_FAILED', url, describeError(error));
  }
  if (result.cues.length === 0 && result.skipped > 0) {
    throw captionError('PARSE_FAILED', url, `No valid cue in ${result.skipped} block(s)`);
  }
  cache.set(key, result);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  return result;
};
