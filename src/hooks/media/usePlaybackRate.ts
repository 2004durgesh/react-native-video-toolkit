import { useVideo } from '../../providers';
import { useCallback } from 'react';

/**
 * Return type for the usePlaybackRate hook.
 */
export interface UsePlaybackRateReturn {
  /** The current playback rate of the video. */
  playbackRate: number;
  /** Sets the playback rate of the video. */
  setPlaybackRate: (playbackRate: number) => void;
}

/**
 * A hook for controlling video playback rate.
 *
 * @returns An object with the following properties:
 * - `playbackRate`: A number indicating the current playback rate of the video.
 * - `setPlaybackRate`: A function to set the playback rate of the video.
 */
export const usePlaybackRate = (): UsePlaybackRateReturn => {
  const { state, dispatch } = useVideo();

  /**
   * Sets the playback rate of the video.
   * @param playbackRate - A number indicating the desired playback rate.
   */
  const setPlaybackRate = useCallback(
    (playbackRate: number) => {
      dispatch({ type: 'SET_PLAYBACK_RATE', payload: playbackRate });
    },
    [dispatch]
  );

  return {
    playbackRate: state.playbackRate,
    setPlaybackRate,
  };
};
