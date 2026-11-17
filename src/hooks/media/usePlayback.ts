import { useVideoSelector } from '../../providers';
import { usePlayerCommands } from '../../providers/PlayerCommands';

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
  const commands = usePlayerCommands();

  return {
    isPlaying,
    ended,
    togglePlayPause: commands.togglePlay,
    setPlaying: commands.setPlaying,
  };
};
