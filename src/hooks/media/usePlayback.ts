import { useVideo } from '../../providers';
import { useControlsVisibility } from './useControlsVisibility';
import { useCallback } from 'react';

/**
 * A hook for controlling video playback.
 *
 * @returns An object with the following properties:
 * - `isPlaying`: A boolean indicating whether the video is currently playing.
 * - `togglePlayPause`: A function to toggle between play and pause.
 * - `setPlaying`: A function to set the playing state directly.
 */
export const usePlayback = () => {
  const { state, dispatch } = useVideo();
  const { showControls } = useControlsVisibility();

  /**
   * Toggles the playback state of the video.
   */
  const togglePlayPause = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAY_PAUSE' });
    const newPlayingState = !state.isPlaying;

    if (newPlayingState) {
      showControls();
    } else if (state.hideTimeoutRef) {
      clearTimeout(state.hideTimeoutRef!);
      showControls();
    }
  }, [dispatch, state.isPlaying, state.hideTimeoutRef, showControls]);

  /**
   * Sets the playback state of the video.
   * @param isPlaying - A boolean indicating whether the video should be playing.
   */
  const setPlaying = useCallback(
    (isPlaying: boolean) => {
      dispatch({ type: 'SET_PLAYING', payload: isPlaying });
    },
    [dispatch]
  );

  return {
    isPlaying: state.isPlaying,
    togglePlayPause,
    setPlaying,
  };
};
