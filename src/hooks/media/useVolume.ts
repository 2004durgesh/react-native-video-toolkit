import { useVideo } from '../../providers';
import { useCallback } from 'react';
import { useControlsVisibility } from './useControlsVisibility';

/**
 * A hook for controlling video volume.
 *
 * @returns An object with the following properties:
 * - `volume`: The current volume of the video, between 0 and 1.
 * - `muted`: A boolean indicating whether the video is muted.
 * - `setVolume`: A function to set the volume of the video.
 * - `toggleMute`: A function to toggle the mute state of the video.
 */
export const useVolume = () => {
  const { state, dispatch } = useVideo();
  const { showControls } = useControlsVisibility();

  /**
   * Sets the volume of the video.
   * @param volume - The volume to set, between 0 and 1.
   */
  const setVolume = useCallback(
    (volume: number) => {
      dispatch({ type: 'SET_VOLUME', payload: volume });
    },
    [dispatch]
  );

  /**
   * Toggles the mute state of the video.
   */
  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
    const newMutedState = !state.muted;
    if (newMutedState) {
      showControls();
    } else if (state.hideTimeoutRef) {
      clearTimeout(state.hideTimeoutRef!);
      showControls();
    }
  }, [dispatch, state.muted, state.hideTimeoutRef, showControls]);

  return {
    volume: state.volume,
    muted: state.muted,
    setVolume,
    toggleMute,
  };
};
