import { createContext, useContext } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { TextTrackType } from 'react-native-video';
import { createCueIndex, type CueIndex } from './cues';
import { CaptionLoadAborted, captionError, describeError, isCaptionError } from './errors';
import { createHlsSubtitleLoader, type HlsSubtitleLoader } from './hls';
import { loadCaptionFile } from './load';
import type { CaptionError, CaptionTrack, Cue } from './types';

/** The player state the controller follows; a change to any of it restarts the prediction. @internal */
export interface CaptionPlayback {
  isPlaying: boolean;
  buffering: boolean;
  ended: boolean;
  pictureInPicture: boolean;
  playbackRate: number;
}

// Every field of `CaptionPlayback`: the type requires each, so a new field can't be left out
const PLAYBACK_FIELDS: Record<keyof CaptionPlayback, true> = {
  isPlaying: true,
  buffering: true,
  ended: true,
  pictureInPicture: true,
  playbackRate: true,
};
const PLAYBACK_KEYS = Object.keys(PLAYBACK_FIELDS) as (keyof CaptionPlayback)[];

/** @internal */
export interface CaptionsControllerOptions {
  /** The media time in seconds: the player's last report, or a seek or preview since. */
  getTime: () => number;
  /** Calls `listener` when the time changes: `'player'` for the player's own report. */
  subscribeTime: (listener: (cause: 'player' | 'seek') => void) => () => void;
  getPlayback: () => CaptionPlayback;
  subscribePlayback: (listener: () => void) => () => void;
  /** Called with load and parse failures. Its own errors are swallowed. */
  onError?: (error: CaptionError) => void;
}

/**
 * How far a progress report may lag behind the predicted time before the prediction gives way.
 * Within this budget (the sync target), the cue stays put instead of flashing back for a moment.
 */
const LAG_TOLERANCE = 150;

/**
 * - `following`: predicting the time between the player's reports.
 * - `resuming`: back from the background, holding the last cue until the player reports again.
 * - `loading`: a new source, showing nothing until the player reports its first position.
 */
type Phase = 'following' | 'resuming' | 'loading';

const sourceKey = (track: CaptionTrack | null) => (track ? `${track.source}:${String(track.uri)}` : '');

/** @internal */
export const isDrawnByToolkit = (track: CaptionTrack | null | undefined): boolean =>
  !!track && track.uri !== undefined && (track.source === 'file' || track.source === 'hls');

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
  const listeners = new Set<() => void>();
  let index: CueIndex | null = null;
  let active: readonly Cue[] = [];
  let anchor = { time: options.getTime() * 1000, at: Date.now() };
  let playback = options.getPlayback();
  let appActive = true;
  let phase: Phase = 'following';
  let timer: ReturnType<typeof setTimeout> | null = null;
  let selected: CaptionTrack | null = null;
  let generation = 0;
  let abort: AbortController | null = null;
  let hls: HlsSubtitleLoader | null = null;

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
    phase === 'following' &&
    appActive &&
    playback.isPlaying &&
    !playback.buffering &&
    !playback.ended &&
    !playback.pictureInPicture;

  /** The media time now, in ms. */
  const mediaTime = () =>
    running() ? anchor.time + (Date.now() - anchor.at) * Math.max(0, playback.playbackRate) : anchor.time;

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const setActive = (next: readonly Cue[]) => {
    if (next.length === active.length && next.every((cue, i) => cue === active[i])) return;
    active = next;
    listeners.forEach((listener) => listener());
  };

  const update = () => {
    clearTimer();
    const time = mediaTime();
    hls?.setTime(time);
    const hidden = !index || phase === 'loading' || playback.ended || playback.pictureInPicture;
    setActive(hidden || !index ? [] : index.activeAt(time));
    if (!hidden && index && running() && playback.playbackRate > 0) {
      const boundary = index.nextBoundary(time);
      if (boundary !== null) {
        // One millisecond past the boundary, so the lookup lands on the new side of it
        const delay = (boundary - time) / playback.playbackRate + 1;
        timer = setTimeout(update, Math.max(0, delay));
      }
    }
  };

  const onTime = (cause: 'player' | 'seek') => {
    // A seek or preview: the time jumps, but a new source still waits for the player's report
    if (cause === 'seek') {
      anchor = { time: options.getTime() * 1000, at: Date.now() };
      return update();
    }
    const reported = options.getTime() * 1000;
    const predicted = mediaTime();
    // A report a little behind the prediction keeps the prediction, so a cue that just changed
    // doesn't flash back; a seek, or anything further, takes the reported time
    const lagging = running() && reported < predicted && predicted - reported <= LAG_TOLERANCE;
    phase = 'following';
    anchor = { time: lagging ? predicted : reported, at: Date.now() };
    update();
  };

  const onPlayback = () => {
    const next = options.getPlayback();
    if (PLAYBACK_KEYS.every((key) => next[key] === playback[key])) return;
    // The prediction restarts from the time it has reached under the old state
    anchor = { time: mediaTime(), at: Date.now() };
    playback = next;
    update();
  };

  const onAppState = (state: AppStateStatus) => {
    const nextActive = state === 'active';
    if (nextActive === appActive) return;
    anchor = { time: mediaTime(), at: Date.now() };
    appActive = nextActive;
    // Coming back, the last report is stale: hold until the player reports again
    if (nextActive && phase === 'following') phase = 'resuming';
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
     * Shows a track the toolkit draws, or none (`null`, Off, or a track the player draws). Selecting
     * the track that's already showing does nothing. `headers` (the stream's) go with an HLS
     * rendition's requests; a subtitle file sends only its own (`track.headers`).
     */
    select: (track: CaptionTrack | null, headers?: Record<string, string>) => {
      const next = isDrawnByToolkit(track) ? track : null;
      if (sourceKey(next) === sourceKey(selected)) return;
      stopLoading();
      selected = next;
      // The old track's cues go at once, so they never show over the new one
      index = null;
      update();
      if (!next) return;

      const current = generation;
      const url = String(next.uri);
      if (next.source === 'file') {
        abort = new AbortController();
        const format = next.type === TextTrackType.SUBRIP ? 'srt' : next.type === TextTrackType.VTT ? 'vtt' : undefined;
        loadCaptionFile(next.uri!, { signal: abort.signal, format, headers: next.headers })
          .then((result) => {
            if (current === generation) setCues(result.cues);
          })
          .catch((error) => {
            if (current === generation) reportError(error, url);
          });
      } else {
        hls = createHlsSubtitleLoader({
          playlistUrl: url,
          headers,
          onCues: (cues) => {
            if (current === generation) setCues(cues);
          },
          onError: (error) => {
            if (current === generation) reportError(error, url);
          },
        });
        hls.setTime(mediaTime());
      }
    },
    /**
     * A new source: no cues show until the player reports its first position, so none run ahead
     * of the video or show over its loading screen.
     */
    reset: () => {
      phase = 'loading';
      anchor = { time: 0, at: Date.now() };
      update();
    },
    /** Reports a failure from loading `url` to `onCaptionError`, as the controller does its own. */
    report: (error: unknown, url: string) => reportError(error, url),
    /** The cues on screen, in start order. A new array exactly when they change. */
    getActive: (): readonly Cue[] => active,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /**
     * Starts following the player. Returns a function that stops it, cancels any load and clears the
     * selection. Players select tracks before the provider starts this (child effects run first), so
     * starting keeps the selection and the phase.
     */
    start: () => {
      anchor = { time: options.getTime() * 1000, at: Date.now() };
      playback = options.getPlayback();
      const unsubscribeTime = options.subscribeTime(onTime);
      const unsubscribePlayback = options.subscribePlayback(onPlayback);
      const appState = AppState.addEventListener('change', onAppState);
      update();
      return () => {
        unsubscribeTime();
        unsubscribePlayback();
        appState.remove();
        clearTimer();
        stopLoading();
        selected = null;
        index = null;
        setActive([]);
      };
    },
  };
};

/** @internal */
export type CaptionsController = ReturnType<typeof createCaptionsController>;

/** @internal */
export const CaptionsControllerContext = createContext<CaptionsController | undefined>(undefined);

/** @internal */
export const useCaptionsController = (): CaptionsController => {
  const controller = useContext(CaptionsControllerContext);
  if (controller === undefined) throw new Error('Captions must be used within a VideoProvider');
  return controller;
};
