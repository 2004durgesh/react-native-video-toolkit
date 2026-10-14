import { useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';
import { useControlsController } from '../../providers/ControlsController';
import { useCallback } from 'react';

/**
 * Return type for the useVolume hook.
 */
export interface UseVolumeReturn {
  /** The current volume of the video, between 0 and 1. */
  volume: number;
  /** Whether the video is muted. */
  muted: boolean;
  /** Sets the volume of the video (0-1). */
  setVolume: (volume: number) => void;
  /** Toggles the mute state of the video. */
  toggleMute: () => void;
}

/**
 * A hook for controlling video volume.
 *
 * @returns An object with the following properties:
 * - `volume`: The current volume of the video, between 0 and 1.
 * - `muted`: A boolean indicating whether the video is muted.
 * - `setVolume`: A function to set the volume of the video.
 * - `toggleMute`: A function to toggle the mute state of the video.
 */
export const useVolume = (): UseVolumeReturn => {
  const volume = useVideoSelector((state) => state.volume);
  const muted = useVideoSelector((state) => state.muted);
  const { dispatch } = useVideoStore();
  const { show: showControls } = useControlsController();

  /**
   * Sets the volume of the video.
   * @param volume - The volume to set, between 0 and 1.
   */
  const setVolume = useCallback(
    (nextVolume: number) => {
      dispatch({ type: 'SET_VOLUME', payload: nextVolume });
    },
    [dispatch]
  );

  /**
   * Toggles the mute state of the video.
   */
  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
    showControls();
  }, [dispatch, showControls]);

  return {
    volume,
    muted,
    setVolume,
    toggleMute,
  };
};
