import { useVideo } from '../../providers';
import { useCallback, useEffect, useRef } from 'react';

/**
 * A hook for controlling the visibility of the video controls.
 *
 * @returns An object with the following properties:
 * - `showControls`: A function to show the controls.
 * - `hideControls`: A function to hide the controls.
 * - `toggleControls`: A function to toggle the visibility of the controls.
 * - `isControlsVisible`: Whether the controls are currently visible.
 */
export const useControlsVisibility = () => {
  const { state, dispatch } = useVideo();
  const { controlsVisible, config, isPlaying, hideTimeoutRef } = state;
  const isMountedRef = useRef(true);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (hideTimeoutRef) {
        clearTimeout(hideTimeoutRef);
      }
    };
  }, [hideTimeoutRef]);

  /**
   * Hides the video controls.
   */
  const hideControls = useCallback(() => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'HIDE_CONTROLS' });
    state.config.onHideControls?.();
  }, [dispatch, state.config]);

  /**
   * Shows the video controls.
   */
  const showControls = useCallback(() => {
    if (!isMountedRef.current) return;

    if (hideTimeoutRef) {
      clearTimeout(hideTimeoutRef);
    }

    dispatch({ type: 'SHOW_CONTROLS' });

    if (config.autoHideControls && isPlaying) {
      const newTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          hideControls();
        }
      }, config.autoHideDelay);
      dispatch({ type: 'SET_HIDE_TIMEOUT', payload: newTimeout as unknown as NodeJS.Timeout });
    }
    state.config.onShowControls?.();
  }, [hideTimeoutRef, config, isPlaying, dispatch, hideControls, state.config]);

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
