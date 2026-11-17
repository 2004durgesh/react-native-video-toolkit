import { useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';
import { useProgressStore } from '../../providers/ProgressStore';
import { usePlayerCommands } from '../../providers/PlayerCommands';
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
  /** @deprecated The player sets the position itself. Will be removed in 2.0. */
  setCurrentTime: (time: number) => void;
  /** @deprecated The player sets the duration itself. Will be removed in 2.0. */
  setDuration: (duration: number) => void;
  /** @deprecated The player sets the playable duration itself. Will be removed in 2.0. */
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
 * - `seek`: A function to seek to a specific time in the video, within its duration.
 */
export const useProgress = (): UseProgressReturn => {
  const duration = useVideoSelector((state) => state.duration);
  const progressStore = useProgressStore();
  const commands = usePlayerCommands();
  const { dispatch } = useVideoStore();
  // The third argument is the snapshot for server rendering, which React requires there
  const { currentTime, playableDuration } = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getSnapshot
  );

  const setCurrentTime = useCallback((time: number) => progressStore.update({ currentTime: time }), [progressStore]);
  const setPlayableDuration = useCallback(
    (playable: number) => progressStore.update({ playableDuration: playable }),
    [progressStore]
  );
  const setDuration = useCallback((next: number) => dispatch({ type: 'SET_DURATION', payload: next }), [dispatch]);

  return {
    currentTime,
    duration,
    playableDuration,
    seek: commands.seek,
    setCurrentTime,
    setDuration,
    setPlayableDuration,
  };
};
