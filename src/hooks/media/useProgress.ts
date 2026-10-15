import { useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';
import { useProgressStore } from '../../providers/ProgressStore';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Return type for the useProgress hook.
 */
export interface UseProgressReturn {
  /** The current time of the video in seconds. */
  currentTime: number;
  /** The duration of the video in seconds. */
  duration: number;
  /** The playable (buffered) duration of the video in seconds. */
  playableDuration: number;
  /** Seeks to a specific time in the video. */
  seek: (time: number) => void;
  /** Sets the current time of the video (internal use). */
  setCurrentTime: (time: number) => void;
  /** Sets the duration of the video (internal use). */
  setDuration: (duration: number) => void;
  /** Sets the playable duration of the video (internal use). */
  setPlayableDuration: (playableDuration: number) => void;
}

/**
 * A hook for controlling video progress.
 *
 * This is the way to read the playback position: it isn't in `useVideo().state`, so progress
 * events re-render only the components that call this hook.
 *
 * @returns An object with the following properties:
 * - `currentTime`: The current time of the video in seconds.
 * - `playableDuration`: The playable duration of the video in seconds.
 * - `duration`: The duration of the video in seconds.
 * - `seek`: A function to seek to a specific time in the video.
 * - `setCurrentTime`: A function to set the current time of the video.
 * - `setPlayableDuration`: A function to set the playable duration of the video.
 * - `setDuration`: A function to set the duration of the video.
 */
export const useProgress = (): UseProgressReturn => {
  const actions = useProgressActions();
  // The third argument is the snapshot for server rendering, which React requires there
  const { currentTime, playableDuration } = useSyncExternalStore(
    actions.progressStore.subscribe,
    actions.progressStore.getSnapshot,
    actions.progressStore.getSnapshot
  );

  return {
    currentTime,
    duration: actions.duration,
    playableDuration,
    seek: actions.seek,
    setCurrentTime: actions.setCurrentTime,
    setDuration: actions.setDuration,
    setPlayableDuration: actions.setPlayableDuration,
  };
};

/**
 * `useProgress()` without the position, so it doesn't re-render on progress events. For toolkit
 * controls that read the position elsewhere (the progress bar's shared values).
 * @internal
 */
export const useProgressActions = () => {
  const videoRef = useVideoSelector((state) => state.videoRef);
  const duration = useVideoSelector((state) => state.duration);
  const store = useVideoStore();
  const { dispatch } = store;
  const progressStore = useProgressStore();

  /**
   * Seeks to a specific time in the video.
   * @param time - The time to seek to in seconds.
   */
  const seek = useCallback(
    (time: number) => {
      if (videoRef?.current) {
        // The duration now, not from the last render: a seek in `onLoad` (resuming) runs before the
        // re-render that has the new duration. Unknown (0) doesn't clamp, or every seek would go to 0.
        const { duration: currentDuration } = store.getState();
        const newTime = Math.max(0, currentDuration > 0 ? Math.min(time, currentDuration) : time);
        videoRef.current.seek(newTime);
        progressStore.update({ currentTime: newTime });
      }
    },
    [videoRef, progressStore, store]
  );

  /**
   * Sets the current time of the video.
   * @param time - The time to set in seconds.
   */
  const setCurrentTime = useCallback(
    (time: number) => {
      progressStore.update({ currentTime: time });
    },
    [progressStore]
  );

  /**
   * Sets the playable duration of the video.
   * @param playableDuration - The playable duration to set in seconds.
   */

  const setPlayableDuration = useCallback(
    (nextPlayableDuration: number) => {
      progressStore.update({ playableDuration: nextPlayableDuration });
    },
    [progressStore]
  );

  /**
   * Sets the duration of the video.
   * @param duration - The duration to set in seconds.
   */
  const setDuration = useCallback(
    (duration: number) => {
      dispatch({ type: 'SET_DURATION', payload: duration });
    },
    [dispatch]
  );

  return { duration, seek, setCurrentTime, setDuration, setPlayableDuration, progressStore };
};
