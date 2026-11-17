import { useVideoSelector } from '../../providers';
import { usePlayerCommands } from '../../providers/PlayerCommands';

/**
 * Return type for the usePlaybackRate hook.
 */
export interface UsePlaybackRateReturn {
  /** The current playback speed, where 1 is normal speed. */
  playbackRate: number;
  /** Sets the playback speed, for example `1.5`. */
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
  const playbackRate = useVideoSelector((state) => state.playbackRate);
  const commands = usePlayerCommands();

  return {
    playbackRate,
    setPlaybackRate: commands.setRate,
  };
};
