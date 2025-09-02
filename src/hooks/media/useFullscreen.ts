import { useVideo } from '../../providers';
import { useCallback, useMemo } from 'react';
import { useControlsVisibility } from './useControlsVisibility';
import { NativeVideoToolkit } from '../../NativeVideoToolkit';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useOrientation } from './useOrientation';

/**
 * A hook for controlling fullscreen mode.
 *
 * @returns An object with the following properties:
 * - `fullscreen`: A boolean indicating whether the video is in fullscreen mode.
 * - `toggleFullscreen`: A function to toggle fullscreen mode with smart orientation.
 * - `fullscreenTapGesture`: A `Gesture` object for handling single taps to toggle fullscreen.
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
      if (state.config.enableScreenRotation) {
        await orientation.lockToLandscape();
      }

      NativeVideoToolkit.enterFullscreen();
      state.config.onEnterFullscreen?.();
    } else {
      // Exiting fullscreen
      if (state.config.enableScreenRotation) {
        await orientation.unlockOrientation();
      }

      NativeVideoToolkit.exitFullscreen();
      state.config.onExitFullscreen?.();

      if (state.hideTimeoutRef) {
        clearTimeout(state.hideTimeoutRef!);
      }
      showControls();
    }
  }, [dispatch, state.fullscreen, state.hideTimeoutRef, state.config, showControls, orientation]);

  const fullscreenTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .numberOfTaps(1)
        .onEnd(() => {
          'worklet';
          runOnJS(toggleFullscreen)();
        }),
    [toggleFullscreen]
  );

  return {
    fullscreen: state.fullscreen,
    toggleFullscreen,
    fullscreenTapGesture,
  };
};
