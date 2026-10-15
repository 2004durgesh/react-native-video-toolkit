import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import {
  Gesture,
  type GestureStateChangeEvent,
  type GestureTouchEvent,
  type LongPressGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import type { UseLongPressGestureProps } from '../../types';
import { usePlaybackRate } from '../media';
import { useVideoStore } from '../../providers/VideoProvider';

/**
 * A hook for handling long press gestures to temporarily increase playback rate.
 *
 * @returns An object with the following properties:
 * - `longPressGesture`: The gesture handler for long presses.
 */
export const useLongPressGesture = ({ onLongPressStart, onLongPressEnd }: UseLongPressGestureProps) => {
  const { setPlaybackRate } = usePlaybackRate();
  const store = useVideoStore();
  const longPressGestureStarted = useRef(false);
  // The rate picked before the 2x boost, so releasing goes back to it rather than to 1x
  const rateBeforeBoost = useRef(1);
  const [isPlaybackRateIncreased, setIsPlaybackRateIncreased] = useState(false); // use this for any ui changes
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startLongPress = useCallback(
    (event: GestureTouchEvent) => {
      longPressGestureStarted.current = false;
      setIsPlaybackRateIncreased(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        longPressGestureStarted.current = true;
        rateBeforeBoost.current = store.getState().playbackRate;
        setIsPlaybackRateIncreased(true);
        onLongPressStart?.(event);
        setPlaybackRate(2);
      }, 2000);
    },
    [onLongPressStart, setPlaybackRate, store]
  );

  const endLongPress = useCallback(
    (event: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (longPressGestureStarted.current) {
        setPlaybackRate(rateBeforeBoost.current);
        onLongPressEnd?.(event);
        longPressGestureStarted.current = false;
        setIsPlaybackRateIncreased(false);
      }
    },
    [onLongPressEnd, setPlaybackRate]
  );

  const longPressGesture = useMemo(
    () =>
      Gesture.LongPress()
        .onTouchesDown((event) => {
          'worklet';
          scheduleOnRN(startLongPress, event);
        })
        .onFinalize((event) => {
          'worklet';
          scheduleOnRN(endLongPress, event);
        }),
    [startLongPress, endLongPress]
  );

  return { longPressGesture, isPlaybackRateIncreased };
};

export default useLongPressGesture;
