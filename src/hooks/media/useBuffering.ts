import { useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';
import { useCallback } from 'react';

/**
 * Return type for the useBuffering hook.
 */
export interface UseBufferingReturn {
  /** Whether the video is currently buffering. */
  buffering: boolean;
  /** @deprecated The player sets it itself. Will be removed in 2.0. */
  setBuffering: (isBuffering: boolean) => void;
}

/**
 * Reads whether the video is buffering.
 *
 * @returns {UseBufferingReturn} `buffering`, and the deprecated `setBuffering`.
 */
export const useBuffering = (): UseBufferingReturn => {
  const buffering = useVideoSelector((state) => state.buffering);
  const { dispatch } = useVideoStore();

  const setBuffering = useCallback(
    (isBuffering: boolean) => {
      dispatch({ type: 'SET_BUFFERING', payload: isBuffering });
    },
    [dispatch]
  );

  return {
    buffering,
    setBuffering,
  };
};
