import { useVideo } from '../../providers';
import { useCallback } from 'react';

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
  const { state, dispatch } = useVideo();
  const { videoRef, duration } = state;

  /**
   * Seeks to a specific time in the video.
   * @param time - The time to seek to in seconds.
   */
  const seek = useCallback(
    (time: number) => {
      if (videoRef?.current) {
        const newTime = Math.max(0, Math.min(time, duration));
        videoRef.current.seek(newTime);
        dispatch({ type: 'SET_CURRENT_TIME', payload: newTime });
      }
    },
    [videoRef, duration, dispatch]
  );

  /**
   * Sets the current time of the video.
   * @param time - The time to set in seconds.
   */
  const setCurrentTime = useCallback(
    (time: number) => {
      dispatch({ type: 'SET_CURRENT_TIME', payload: time });
    },
    [dispatch]
  );

  /**
   * Sets the playable duration of the video.
   * @param playableDuration - The playable duration to set in seconds.
   */

  const setPlayableDuration = useCallback(
    (playableDuration: number) => {
      dispatch({ type: 'SET_PLAYABLE_DURATION', payload: playableDuration });
    },
    [dispatch]
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

  return {
    currentTime: state.currentTime,
    duration: state.duration,
    playableDuration: state.playableDuration,
    seek,
    setCurrentTime,
    setDuration,
    setPlayableDuration,
  };
};
