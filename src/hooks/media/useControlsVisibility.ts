import { useVideoSelector } from '../../providers';
import { useControlsController } from '../../providers/ControlsController';

/**
 * Return type for the useControlsVisibility hook.
 */
export interface UseControlsVisibilityReturn {
  /** Shows the video controls. */
  showControls: () => void;
  /** Hides the video controls. */
  hideControls: () => void;
  /** Toggles the visibility of the video controls. */
  toggleControls: () => void;
  /** Whether the controls are currently visible. */
  controlsVisible: boolean;
}

/**
 * A hook for controlling the visibility of the video controls.
 *
 * @returns An object with the following properties:
 * - `showControls`: A function to show the controls.
 * - `hideControls`: A function to hide the controls.
 * - `toggleControls`: A function to toggle the visibility of the controls.
 * - `controlsVisible`: Whether the controls are currently visible.
 *
 * The functions are stable and shared by every caller, with one auto-hide timer per `VideoProvider`.
 */
export const useControlsVisibility = (): UseControlsVisibilityReturn => {
  const controlsVisible = useVideoSelector((state) => state.controlsVisible);
  const controls = useControlsController();

  return {
    showControls: controls.show,
    hideControls: controls.hide,
    toggleControls: controls.toggle,
    controlsVisible,
  };
};
