import { useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';
import { useControlsController } from '../../providers/ControlsController';
import { useCallback } from 'react';

/**
 * Return type for the usePlayback hook.
 */
export interface UsePlaybackReturn {
  /** Whether the video is currently playing. */
  isPlaying: boolean;
  /**
   * Whether playback reached the end of the source. Cleared when it plays again or a new source loads.
   */
  ended: boolean;
  /** Toggles between play and pause. */
  togglePlayPause: () => void;
  /** Sets the playing state directly. */
  setPlaying: (isPlaying: boolean) => void;
}

/**
 * A hook for controlling video playback.
 *
 * @returns An object with the following properties:
 * - `isPlaying`: A boolean indicating whether the video is currently playing.
 * - `togglePlayPause`: A function to toggle between play and pause.
 * - `setPlaying`: A function to set the playing state directly.
 */
export const usePlayback = (): UsePlaybackReturn => {
  const isPlaying = useVideoSelector((state) => state.isPlaying);
  const ended = useVideoSelector((state) => state.ended);
  const { dispatch } = useVideoStore();
  const { show: showControls } = useControlsController();

  /**
   * Toggles the playback state of the video.
   */
  const togglePlayPause = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAY_PAUSE' });
    showControls();
  }, [dispatch, showControls]);

  /**
   * Sets the playback state of the video.
   * @param isPlaying - A boolean indicating whether the video should be playing.
   */
  const setPlaying = useCallback(
    (playing: boolean) => {
      dispatch({ type: 'SET_PLAYING', payload: playing });
    },
    [dispatch]
  );

  return {
    isPlaying,
    ended,
    togglePlayPause,
    setPlaying,
  };
};
