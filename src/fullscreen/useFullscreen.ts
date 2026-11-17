import { useVideoSelector } from '../providers';
import { usePlayerCommands } from '../providers/PlayerCommands';

/**
 * Return type for the useFullscreen hook.
 */
export interface UseFullscreenReturn {
  /** Whether the video is in fullscreen mode. */
  fullscreen: boolean;
  /** Enters fullscreen, or exits it when the video is already there. */
  toggleFullscreen: () => Promise<void>;
  /** Enters fullscreen and calls `config.onEnterFullscreen`. Does nothing in fullscreen. */
  enterFullscreen: () => Promise<void>;
  /** Exits fullscreen and calls `config.onExitFullscreen`. Does nothing outside fullscreen. */
  exitFullscreen: () => Promise<void>;
}

/**
 * A hook for controlling fullscreen mode. With `config.enableScreenRotation` (the default),
 * entering turns the screen to landscape; exiting returns phones to portrait and lets tablets and
 * foldables rotate freely. On web it fullscreens the player that called it.
 *
 * @returns An object with the following properties:
 * - `fullscreen`: A boolean indicating whether the video is in fullscreen mode.
 * - `toggleFullscreen`: A function to toggle fullscreen mode.
 * - `enterFullscreen`: A function to enter fullscreen mode.
 * - `exitFullscreen`: A function to exit fullscreen mode.
 */
export const useFullscreen = (): UseFullscreenReturn => {
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  const { enterFullscreen, exitFullscreen, toggleFullscreen } = usePlayerCommands();
  return { fullscreen, toggleFullscreen, enterFullscreen, exitFullscreen };
};
