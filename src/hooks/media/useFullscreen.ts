import { useVideo } from '../../providers';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useControlsVisibility } from './useControlsVisibility';
import { NativeVideoToolkit } from '../../NativeVideoToolkit';
import { useOrientation } from './useOrientation';

/**
 * A hook for controlling fullscreen mode.
 *
 * @returns An object with the following properties:
 * - `fullscreen`: A boolean indicating whether the video is in fullscreen mode.
 * - `toggleFullscreen`: A function to toggle fullscreen mode with smart orientation.
 */
export const useFullscreen = () => {
  const { state, dispatch } = useVideo();
  const { showControls } = useControlsVisibility();
  const orientation = useOrientation();

  /**
   * Enhanced fullscreen toggle with intelligent orientation handling
   */
  const toggleFullscreen = useCallback(async () => {
    dispatch({ type: 'TOGGLE_FULLSCREEN' });
    const newFullscreenState = !state.fullscreen;

    if (newFullscreenState) {
      // Entering fullscreen
      showControls();

      // Use orientation hook's smart rotation
      if (Platform.OS !== 'web' && state.config.enableScreenRotation) {
        await orientation.lockToLandscape();
      }

      NativeVideoToolkit.enterFullscreen();
      state.config.onEnterFullscreen?.();
    } else {
      // Exiting fullscreen
      if (Platform.OS !== 'web' && state.config.enableScreenRotation) {
        await orientation.lockToPortrait();
      }

      NativeVideoToolkit.exitFullscreen();
      state.config.onExitFullscreen?.();

      if (state.hideTimeoutRef) {
        clearTimeout(state.hideTimeoutRef!);
      }
      showControls();
    }
  }, [dispatch, state.fullscreen, state.hideTimeoutRef, state.config, showControls, orientation]);

  return {
    fullscreen: state.fullscreen,
    toggleFullscreen,
  };
};
