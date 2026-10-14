import { useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';
import { useControlsController } from '../../providers/ControlsController';
import { useCallback } from 'react';
import { Platform } from 'react-native';
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
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  const config = useVideoSelector((state) => state.config);
  const { dispatch } = useVideoStore();
  const { show: showControls } = useControlsController();
  const orientation = useOrientation();

  /**
   * Enters fullscreen mode with intelligent orientation handling
   */
  const enterFullscreen = useCallback(async () => {
    if (fullscreen) return; // Already in fullscreen

    dispatch({ type: 'SET_FULLSCREEN', payload: true });
    showControls();

    if (Platform.OS !== 'web' && config.enableScreenRotation) {
      await orientation.lockToLandscape();
    }

    NativeVideoToolkit.enterFullscreen();
    config.onEnterFullscreen?.();
  }, [dispatch, fullscreen, config, showControls, orientation]);

  /**
   * Exits fullscreen mode with intelligent orientation handling
   */
  const exitFullscreen = useCallback(async () => {
    if (!fullscreen) return; // Not in fullscreen

    dispatch({ type: 'SET_FULLSCREEN', payload: false });

    if (Platform.OS !== 'web' && config.enableScreenRotation) {
      await orientation.lockToPortrait();
    }

    NativeVideoToolkit.exitFullscreen();
    config.onExitFullscreen?.();
    showControls();
  }, [dispatch, fullscreen, config, showControls, orientation]);

  /**
   * Toggles fullscreen mode with intelligent orientation handling
   */
  const toggleFullscreen = useCallback(async () => {
    if (fullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [fullscreen, enterFullscreen, exitFullscreen]);

  return {
    fullscreen: fullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
};
