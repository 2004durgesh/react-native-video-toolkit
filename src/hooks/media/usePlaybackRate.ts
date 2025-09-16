import { useVideo } from '../../providers';
import { useCallback } from 'react';

/**
 * A hook for controlling video buffering.
 *
 * @returns An object with the following properties:
 * - `playbackRate`: A number indicating the current playback rate of the video.
 * - `setPlaybackRate`: A function to set the playback rate of the video.
 */
export const usePlaybackRate = () => {
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
