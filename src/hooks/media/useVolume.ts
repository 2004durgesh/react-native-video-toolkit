import { useVideoSelector } from '../../providers';
import { usePlayerCommands } from '../../providers/PlayerCommands';

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
  const commands = usePlayerCommands();

  return {
    volume,
    muted,
    setVolume: commands.setVolume,
    toggleMute: commands.toggleMute,
  };
};
