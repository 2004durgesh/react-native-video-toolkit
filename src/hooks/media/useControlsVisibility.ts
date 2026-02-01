import { useVideo } from '../../providers';
import { useCallback, useEffect, useRef } from 'react';

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
 * - `isControlsVisible`: Whether the controls are currently visible.
 */
export const useControlsVisibility = (): UseControlsVisibilityReturn => {
  const { state, dispatch } = useVideo();
  const { controlsVisible, config, isPlaying, hideTimeoutRef } = state;
  const isMountedRef = useRef(true);
  const hideTimeoutRefLocal = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store callbacks in refs to avoid dependency issues with React Compiler
  const onHideControlsRef = useRef(config.onHideControls);
  const onShowControlsRef = useRef(config.onShowControls);

  // Keep refs in sync with latest config values
  useEffect(() => {
    onHideControlsRef.current = config.onHideControls;
    onShowControlsRef.current = config.onShowControls;
  }, [config.onHideControls, config.onShowControls]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (hideTimeoutRefLocal.current) {
        clearTimeout(hideTimeoutRefLocal.current);
      }
    };
  }, []);

  /**
   * Hides the video controls.
   */
  const hideControls = useCallback(() => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'HIDE_CONTROLS' });
    onHideControlsRef.current?.();
  }, [dispatch]);

  /**
   * Shows the video controls.
   */
  const showControls = useCallback(() => {
    if (!isMountedRef.current) return;

    if (hideTimeoutRefLocal.current) {
      clearTimeout(hideTimeoutRefLocal.current);
    }

    dispatch({ type: 'SHOW_CONTROLS' });

    if (config.autoHideControls && isPlaying) {
      const newTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          dispatch({ type: 'HIDE_CONTROLS' });
          onHideControlsRef.current?.();
        }
      }, config.autoHideDelay);
      hideTimeoutRefLocal.current = newTimeout;
      dispatch({ type: 'SET_HIDE_TIMEOUT', payload: newTimeout as unknown as NodeJS.Timeout });
    }
    onShowControlsRef.current?.();
  }, [config.autoHideControls, config.autoHideDelay, isPlaying, dispatch]);

  /**
   * Toggles the visibility of the video controls.
   */
  const toggleControls = useCallback(() => {
    if (controlsVisible) {
      hideControls();
    } else {
      showControls();
    }
  }, [controlsVisible, hideControls, showControls]);

  return {
    showControls,
    hideControls,
    toggleControls,
    controlsVisible,
  };
};
