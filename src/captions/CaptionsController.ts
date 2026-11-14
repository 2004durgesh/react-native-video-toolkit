import { createContext, useContext } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { createCueIndex, type CueIndex } from './cues';
import { CaptionLoadAborted, captionError, describeError, isCaptionError } from './errors';
import { createHlsSubtitleLoader, type HlsSubtitleLoader } from './hls';
import { loadCaptionFile, type CaptionSource } from './load';
import type { CaptionError, CaptionFormat, Cue } from './types';

/**
 * What the custom renderer shows: a subtitle file, or an HLS subtitle rendition.
 * @internal
 */
export type CaptionTrackSource =
  | { kind: 'file'; uri: CaptionSource; format?: CaptionFormat; encoding?: string }
  | { kind: 'hls'; playlistUrl: string; headers?: Record<string, string> };

/** The player state the controller follows. @internal */
export interface CaptionPlayback {
  isPlaying: boolean;
  buffering: boolean;
  ended: boolean;
  pictureInPicture: boolean;
  playbackRate: number;
}

/** What the controller reads from the provider. @internal */
export interface CaptionsControllerOptions {
  /** The media time in seconds, as the player last reported it (or a seek or preview set it). */
  getTime: () => number;
  subscribeTime: (listener: () => void) => () => void;
  getPlayback: () => CaptionPlayback;
  subscribePlayback: (listener: () => void) => () => void;
  /** Called with load and parse failures. Its own errors are swallowed. */
  onError?: (error: CaptionError) => void;
  /** The clock, in ms. @default Date.now */
  now?: () => number;
}

/**
 * How far a progress report may lag behind the predicted time before the prediction gives way.
 * Within this budget (the sync target), the cue stays put instead of flashing back for a moment.
 */
const LAG_TOLERANCE = 150;

const sourceKey = (source: CaptionTrackSource | null) =>
  source === null ? '' : source.kind === 'file' ? `file:${String(source.uri)}` : `hls:${source.playlistUrl}`;

/**
 * Decides which cues show, for one `VideoProvider`. It loads the selected track, follows the
 * player's media time, and works out the cues for each moment:
 *
 * - Media time comes from the player's progress reports, predicted forward between them while
 *   playing (`last + elapsed × rate`), never from a free-running clock.
 * - Instead of polling, it sets one timer for the next cue boundary. Nothing runs while paused,
 *   buffering, ended, in picture-in-picture, in the background, or with no custom track.
 * - It tells listeners only when the cues on screen change.
 * @internal
 */
export const createCaptionsController = (options: CaptionsControllerOptions) => {
  const now = options.now ?? Date.now;
  const listeners = new Set<() => void>();
  let index: CueIndex | null = null;
  let active: Cue[] = [];
  let key = '';
  let anchor = { time: options.getTime() * 1000, at: now() };
  let playback = options.getPlayback();
  let appActive = true;
  // After returning from the background the last reported time is stale until the next report
  let awaitingReport = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let selected: CaptionTrackSource | null = null;
  let generation = 0;
  let abort: AbortController | null = null;
  let hls: HlsSubtitleLoader | null = null;
  const cueIds = new WeakMap<Cue, number>();
  let nextCueId = 1;

  const idOf = (cue: Cue) => {
    let id = cueIds.get(cue);
    if (id === undefined) {
      id = nextCueId++;
      cueIds.set(cue, id);
    }
    return id;
  };

  const reportError = (error: unknown, url: string) => {
    if (error instanceof CaptionLoadAborted) return;
    const captionErr = isCaptionError(error) ? error : captionError('LOAD_FAILED', url, describeError(error));
    if (__DEV__)
      console.warn(
        `[react-native-video-toolkit] Subtitles: ${captionErr.code} ${captionErr.url}: ${captionErr.reason}`
      );
    try {
      options.onError?.(captionErr);
    } catch (callbackError) {
      if (__DEV__) console.warn('[react-native-video-toolkit] onCaptionError threw:', callbackError);
    }
  };

  const running = () =>
    playback.isPlaying &&
    !playback.buffering &&
    !playback.ended &&
    !playback.pictureInPicture &&
    appActive &&
    !awaitingReport;

  /** The media time now, in ms. */
  const mediaTime = () =>
    running() ? anchor.time + (now() - anchor.at) * Math.max(0, playback.playbackRate) : anchor.time;

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const update = () => {
    clearTimer();
    const time = mediaTime();
    hls?.setTime(time);
    const hidden = !index || playback.ended || playback.pictureInPicture;
    const next = hidden || !index ? [] : index.activeAt(time);
    const nextKey = next.map(idOf).join(',');
    if (nextKey !== key) {
      key = nextKey;
      active = next;
      listeners.forEach((listener) => listener());
    }
    if (!hidden && index && running() && playback.playbackRate > 0) {
      const boundary = index.nextBoundary(time);
      if (boundary !== null) {
        // One millisecond past the boundary, so the lookup lands on the new side of it
        const delay = (boundary - time) / playback.playbackRate + 1;
        timer = setTimeout(update, Math.max(0, delay));
      }
    }
  };

  /** Restarts the prediction from the time it has reached, before the playback state changes. */
  const reanchor = () => {
    anchor = { time: mediaTime(), at: now() };
  };

  const onTime = () => {
    const reported = options.getTime() * 1000;
    const predicted = mediaTime();
    awaitingReport = false;
    // A report a little behind the prediction keeps the prediction, so a cue that just changed
    // doesn't flash back; a seek, or anything further, takes the reported time
    const lagging = running() && reported < predicted && predicted - reported <= LAG_TOLERANCE;
    anchor = { time: lagging ? predicted : reported, at: now() };
    update();
  };

  const onPlayback = () => {
    reanchor();
    playback = options.getPlayback();
    anchor.at = now();
    update();
  };

  const onAppState = (state: AppStateStatus) => {
    const nextActive = state === 'active';
    if (nextActive === appActive) return;
    reanchor();
    appActive = nextActive;
    // Coming back, the last report is stale: hold until the player reports again
    if (nextActive) awaitingReport = true;
    update();
  };

  const stopLoading = () => {
    generation += 1;
    abort?.abort();
    abort = null;
    hls?.dispose();
    hls = null;
  };

  const setCues = (cues: Cue[]) => {
    index = createCueIndex(cues);
    update();
  };

  return {
    /**
     * Shows a track, or none (`null`: Off, or a track the player renders natively). Selecting the
     * track that's already showing does nothing.
     */
    select: (source: CaptionTrackSource | null) => {
      if (sourceKey(source) === sourceKey(selected)) return;
      stopLoading();
      selected = source;
      // The old track's cues go at once, so they never show over the new one
      index = null;
      update();
      if (!source) return;

      const current = generation;
      if (source.kind === 'file') {
        abort = new AbortController();
        loadCaptionFile(source.uri, { signal: abort.signal, format: source.format, encoding: source.encoding })
          .then((result) => {
            if (current === generation) setCues(result.cues);
          })
          .catch((error) => {
            if (current === generation) reportError(error, String(source.uri));
          });
      } else {
        hls = createHlsSubtitleLoader({
          playlistUrl: source.playlistUrl,
          headers: source.headers,
          onCues: (cues) => {
            if (current === generation) setCues(cues);
          },
          onError: (error) => {
            if (current === generation) reportError(error, source.playlistUrl);
          },
        });
        hls.setTime(mediaTime());
      }
    },
    /**
     * A new video: call after the time is set back to its start. The time holds there until the
     * player reports it, so cues don't run ahead while the video loads.
     */
    reset: () => {
      anchor = { time: options.getTime() * 1000, at: now() };
      awaitingReport = true;
      update();
    },
    /** Passes an error to `onCaptionError`, as the controller does for its own. */
    report: (error: CaptionError) => reportError(error, error.url),
    /** The cues on screen, in start order. */
    getActive: (): readonly Cue[] => active,
    /** Changes exactly when the cues on screen change. */
    getKey: () => key,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Starts following the player. Returns a function that stops it and cancels any load. */
    start: () => {
      anchor = { time: options.getTime() * 1000, at: now() };
      playback = options.getPlayback();
      const unsubscribeTime = options.subscribeTime(onTime);
      const unsubscribePlayback = options.subscribePlayback(() => {
        const next = options.getPlayback();
        if (
          next.isPlaying !== playback.isPlaying ||
          next.buffering !== playback.buffering ||
          next.ended !== playback.ended ||
          next.pictureInPicture !== playback.pictureInPicture ||
          next.playbackRate !== playback.playbackRate
        ) {
          onPlayback();
        }
      });
      const appState = AppState.addEventListener('change', onAppState);
      update();
      return () => {
        unsubscribeTime();
        unsubscribePlayback();
        appState.remove();
        clearTimer();
        stopLoading();
        selected = null;
      };
    },
  };
};

/** @internal */
export type CaptionsController = ReturnType<typeof createCaptionsController>;

/** @internal */
export const CaptionsControllerContext = createContext<CaptionsController | undefined>(undefined);

/**
 * The captions controller of the nearest `VideoProvider`.
 * @internal
 */
export const useCaptionsController = (): CaptionsController => {
  const controller = useContext(CaptionsControllerContext);
  if (controller === undefined) throw new Error('Captions must be used within a VideoProvider');
  return controller;
};
