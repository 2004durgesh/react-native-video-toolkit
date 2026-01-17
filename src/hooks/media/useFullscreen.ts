import { useVideo } from '../../providers';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useControlsVisibility } from './useControlsVisibility';
import { NativeVideoToolkit } from '../../NativeVideoToolkit';
import { useOrientation } from './useOrientation';

/**
 * Return type for the useFullscreen hook.
 */
export interface UseFullscreenReturn {
  /** Whether the video is in fullscreen mode. */
  fullscreen: boolean;
  /** Toggles fullscreen mode with smart orientation handling. */
  toggleFullscreen: () => Promise<void>;
  /** Enters fullscreen mode with smart orientation handling. */
  enterFullscreen: () => Promise<void>;
  /** Exits fullscreen mode with smart orientation handling. */
  exitFullscreen: () => Promise<void>;
}

/**
 * A hook for controlling fullscreen mode.
 *
 * @returns An object with the following properties:
 * - `fullscreen`: A boolean indicating whether the video is in fullscreen mode.
 * - `toggleFullscreen`: A function to toggle fullscreen mode with smart orientation.
 * - `enterFullscreen`: A function to enter fullscreen mode.
 * - `exitFullscreen`: A function to exit fullscreen mode.
 */
export const useFullscreen = (): UseFullscreenReturn => {
  const { state, dispatch } = useVideo();
  const { showControls } = useControlsVisibility();
  const orientation = useOrientation();

  /**
   * Enters fullscreen mode with intelligent orientation handling
   */
  const enterFullscreen = useCallback(async () => {
    if (state.fullscreen) return; // Already in fullscreen

    dispatch({ type: 'TOGGLE_FULLSCREEN' });
    showControls();

    if (Platform.OS !== 'web' && state.config.enableScreenRotation) {
      await orientation.lockToLandscape();
    }

    NativeVideoToolkit.enterFullscreen();
    state.config.onEnterFullscreen?.();
  }, [dispatch, state.fullscreen, state.config, showControls, orientation]);

  /**
   * Exits fullscreen mode with intelligent orientation handling
   */
  const exitFullscreen = useCallback(async () => {
    if (!state.fullscreen) return; // Not in fullscreen

    dispatch({ type: 'TOGGLE_FULLSCREEN' });

    if (Platform.OS !== 'web' && state.config.enableScreenRotation) {
      await orientation.lockToPortrait();
    }

    NativeVideoToolkit.exitFullscreen();
    state.config.onExitFullscreen?.();

    if (state.hideTimeoutRef) {
      clearTimeout(state.hideTimeoutRef);
    }
    showControls();
  }, [dispatch, state.fullscreen, state.hideTimeoutRef, state.config, showControls, orientation]);

  /**
   * Toggles fullscreen mode with intelligent orientation handling
   */
  const toggleFullscreen = useCallback(async () => {
    if (state.fullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [state.fullscreen, enterFullscreen, exitFullscreen]);

  return {
    fullscreen: state.fullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
};
