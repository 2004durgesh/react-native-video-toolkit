import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import {
  Gesture,
  type GestureStateChangeEvent,
  type GestureTouchEvent,
  type LongPressGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { UseLongPressGestureProps } from '../../types';
import { usePlaybackRate } from '../media';

/**
 * A hook for handling long press gestures to temporarily increase playback rate.
 *
 * @returns An object with the following properties:
 * - `longPressGesture`: The gesture handler for long presses.
 */
export const useLongPressGesture = ({ onLongPressStart, onLongPressEnd }: UseLongPressGestureProps) => {
  const { setPlaybackRate } = usePlaybackRate();
  const longPressGestureStarted = useRef(false);
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
        setIsPlaybackRateIncreased(true);
        onLongPressStart?.(event);
        setPlaybackRate(2);
      }, 2000);
    },
    [onLongPressStart, setPlaybackRate]
  );

  const endLongPress = useCallback(
    (event: GestureStateChangeEvent<LongPressGestureHandlerEventPayload>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (longPressGestureStarted.current) {
        setPlaybackRate(1);
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
          runOnJS(startLongPress)(event);
        })
        .onFinalize((event) => {
          'worklet';
          runOnJS(endLongPress)(event);
        }),
    [startLongPress, endLongPress]
  );

  return { longPressGesture, isPlaybackRateIncreased };
};

export default useLongPressGesture;
