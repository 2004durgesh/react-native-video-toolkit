import { useVideo } from '../../providers';
import { useCallback, useMemo } from 'react';
import { useControlsVisibility } from './useControlsVisibility';
import { NativeVideoToolkit } from '../../NativeVideoToolkit';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Platform } from 'react-native';

/**
 * A hook for controlling fullscreen mode.
 *
 * @returns An object with the following properties:
 * - `fullscreen`: A boolean indicating whether the video is in fullscreen mode.
 * - `toggleFullscreen`: A function to toggle fullscreen mode.
 * - `fullscreenTapGesture`: A `Gesture` object for handling single taps to toggle fullscreen.
 */
export const useFullscreen = () => {
  const { state, dispatch } = useVideo();
  const { showControls } = useControlsVisibility();

  /**
   * Toggles the fullscreen mode of the video.
   */
  const toggleFullscreen = useCallback(async () => {
    dispatch({ type: 'TOGGLE_FULLSCREEN' });
    const newFullscreenState = !state.fullscreen;

    if (newFullscreenState) {
      showControls();
      if (state.config.enableScreenRotation && Platform.OS !== 'web') {
        RNOrientationDirector.lockTo(Orientation.landscape);
      }
      NativeVideoToolkit.enterFullscreen();
      state.config.onEnterFullscreen?.();
    } else if (state.hideTimeoutRef) {
      if (state.config.enableScreenRotation && Platform.OS !== 'web') {
        RNOrientationDirector.lockTo(Orientation.portrait);
      }
      NativeVideoToolkit.exitFullscreen();
      state.config.onExitFullscreen?.();
      clearTimeout(state.hideTimeoutRef!);
      showControls();
    }
  }, [dispatch, state.fullscreen, state.hideTimeoutRef, showControls, state.config]);

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
