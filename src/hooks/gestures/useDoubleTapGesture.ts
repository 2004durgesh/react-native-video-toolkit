import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import type { UseDoubleTapGestureProps } from '../../types';
import { useVideo } from '../../providers';

/**
 * A hook for handling double tap gestures to seek forward or backward in the video.
 *
 * @param props - The properties for the hook.
 * @returns An object with the following properties:
 * - `doubleTapGesture`: The gesture handler for double taps.
 * - `isDoubleTap`: A boolean indicating whether a double tap is in progress.
 * - `doubleTapValue`: An object with the forward and backward seek values.
 * - `backwardRippleRef`: A ref for the backward ripple animation container.
 * - `forwardRippleRef`: A ref for the forward ripple animation container.
 * - `backwardAnimatedRipple`: The animated style for the backward ripple effect.
 * - `forwardAnimatedRipple`: The animated style for the forward ripple effect.
 * - `forwardAnimatedStyle`: The animated style for the forward seek animation.
 * - `backwardAnimatedStyle`: The animated style for the backward seek animation.
 */
export const useDoubleTapGesture = ({
  videoRef,
  doubleTapSeekInterval = 10,
  onDoubleTapSeekStart,
  onDoubleTapSeekEnd,
}: UseDoubleTapGestureProps) => {
  const { dispatch } = useVideo();
  const [isDoubleTap, setIsDoubleTap] = useState(false);
  const tapCount = useSharedValue(0);
  const lastTap = useRef(0);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values
  const forwardOpacity = useSharedValue(0);
  const backwardOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(1);

  // Separate counters for consecutive taps
  const consecutiveTapCount = useRef({
    forward: 0,
    backward: 0,
    lastDirection: null as 'forward' | 'backward' | null,
    lastTapTime: 0,
  });

  const [doubleTapValue, setDoubleTapValue] = useState({
    forward: 0,
    backward: 0,
  });

  // Ripple effect states - separate for each direction
  const forwardTranslateX = useSharedValue(0);
  const forwardTranslateY = useSharedValue(0);
  const backwardTranslateX = useSharedValue(0);
  const backwardTranslateY = useSharedValue(0);

  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0.3);

  // Separate dimensions for each ripple container
  const forwardBoxWidth = useSharedValue(0);
  const forwardBoxHeight = useSharedValue(0);
  const backwardBoxWidth = useSharedValue(0);
  const backwardBoxHeight = useSharedValue(0);

  const backwardRippleRef = useAnimatedRef();
  const forwardRippleRef = useAnimatedRef();
  const activeDirection = useSharedValue<'forward' | 'backward' | null>(null);

  const resetConsecutiveCount = useCallback(
    (direction: 'forward' | 'backward') => {
      consecutiveTapCount.current = {
        forward: 0,
        backward: 0,
        lastDirection: null,
        lastTapTime: 0,
      };
      setDoubleTapValue((prev) => ({
        ...prev,
        [direction]: doubleTapSeekInterval,
      }));
    },
    [doubleTapSeekInterval]
  );

  const showTapAnimation = useCallback(
    (direction: 'forward' | 'backward') => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      const animationValue = direction === 'forward' ? forwardOpacity : backwardOpacity;

      animationValue.value = withSequence(withSpring(1), withTiming(0, { duration: 250 }));

      scaleValue.value = withSequence(withSpring(1.2), withSpring(1));

      animationTimeoutRef.current = setTimeout(() => {
        runOnJS(resetConsecutiveCount)(direction);
      }, 1000);
    },
    [forwardOpacity, backwardOpacity, scaleValue, resetConsecutiveCount]
  );

  const handleSeek = useCallback(
    async (direction: 'forward' | 'backward') => {
      if (!videoRef?.current) return;

      const now = Date.now();
      const timeSinceLastTap = now - consecutiveTapCount.current.lastTapTime;
      const isConsecutive = timeSinceLastTap < 500 && direction === consecutiveTapCount.current.lastDirection;

      try {
        const currentTime = await videoRef.current.getCurrentPosition();
        const seekAmount = direction === 'forward' ? doubleTapSeekInterval : -doubleTapSeekInterval;
        const newPosition = Math.max(currentTime + seekAmount, 0);

        videoRef.current.seek(newPosition);
        runOnJS(dispatch)({ type: 'SET_CURRENT_TIME', payload: newPosition });

        if (isConsecutive) {
          consecutiveTapCount.current[direction]++;
          setDoubleTapValue((prev) => ({
            ...prev,
            [direction]: doubleTapSeekInterval * (consecutiveTapCount.current[direction] + 1),
          }));
        } else {
          consecutiveTapCount.current = {
            forward: 0,
            backward: 0,
            lastDirection: direction,
            lastTapTime: now,
          };
          setDoubleTapValue((prev) => ({
            ...prev,
            [direction]: doubleTapSeekInterval,
          }));
        }

        consecutiveTapCount.current.lastDirection = direction;
        consecutiveTapCount.current.lastTapTime = now;

        runOnJS(showTapAnimation)(direction);
      } catch (error) {
        console.error('Seek failed:', error);
      }
    },
    [videoRef, doubleTapSeekInterval, showTapAnimation, dispatch]
  );

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .onStart((event) => {
          const now = Date.now();
          const timeSinceLastTap = now - lastTap.current;
          lastTap.current = now;

          if (timeSinceLastTap > 500) {
            tapCount.value = 0;
          }

          runOnJS(setIsDoubleTap)(true);
          if (onDoubleTapSeekStart) {
            runOnJS(onDoubleTapSeekStart)();
          }

          const touchX = event.absoluteX;
          const screenMidPoint = Dimensions.get('window').width / 2;
          const direction = touchX < screenMidPoint ? 'backward' : 'forward';
          activeDirection.value = direction;

          // Store touch coordinates for the specific direction
          if (direction === 'forward') {
            forwardTranslateX.value = event.x - screenMidPoint;
            forwardTranslateY.value = event.y;
          } else {
            backwardTranslateX.value = event.x;
            backwardTranslateY.value = event.y;
          }

          // Reset and start ripple animation
          rippleScale.value = 0;
          rippleScale.value = withTiming(1, { duration: 500 });
          rippleOpacity.value = 0.4;

          runOnJS(handleSeek)(direction);
        })
        .onEnd(() => {
          runOnJS(setIsDoubleTap)(false);
          if (onDoubleTapSeekEnd) {
            runOnJS(onDoubleTapSeekEnd)();
          }
          rippleOpacity.value = withTiming(0, { duration: 500 });
        })
        .runOnJS(true),
    [
      onDoubleTapSeekStart,
      activeDirection,
      forwardTranslateX,
      forwardTranslateY,
      backwardTranslateX,
      backwardTranslateY,
      rippleScale,
      rippleOpacity,
      handleSeek,
      tapCount,
      onDoubleTapSeekEnd,
    ]
  );

  const backwardAnimatedRipple = useAnimatedStyle(() => {
    if (activeDirection.value !== 'backward') {
      return { opacity: 0 };
    }

    const boxLayout = measure(backwardRippleRef);
    if (!boxLayout) return { opacity: 0 };

    // Update dimensions
    backwardBoxWidth.value = boxLayout.width;
    backwardBoxHeight.value = boxLayout.height;

    // Calculate radius to cover the entire container
    const radius = Math.sqrt(backwardBoxWidth.value ** 2 + backwardBoxHeight.value ** 2);
    const diameter = radius * 2;

    return {
      width: diameter,
      height: diameter,
      borderRadius: radius,
      backgroundColor: 'white',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1,
      opacity: rippleOpacity.value,
      transform: [
        { translateX: backwardTranslateX.value - radius },
        { translateY: backwardTranslateY.value - radius },
        { scale: rippleScale.value },
      ],
    };
  }, [
    backwardRippleRef,
    activeDirection,
    backwardBoxWidth,
    backwardBoxHeight,
    backwardTranslateX,
    backwardTranslateY,
    rippleOpacity,
    rippleScale,
  ]);

  const forwardAnimatedRipple = useAnimatedStyle(() => {
    if (activeDirection.value !== 'forward') {
      return { opacity: 0 };
    }

    const boxLayout = measure(forwardRippleRef);
    if (!boxLayout) return { opacity: 0 };

    // Update dimensions
    forwardBoxWidth.value = boxLayout.width;
    forwardBoxHeight.value = boxLayout.height;

    // Calculate radius to cover the entire container
    const radius = Math.sqrt(forwardBoxWidth.value ** 2 + forwardBoxHeight.value ** 2);
    const diameter = radius * 2;

    return {
      width: diameter,
      height: diameter,
      borderRadius: radius,
      backgroundColor: 'white',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1,
      opacity: rippleOpacity.value,
      transform: [
        { translateX: forwardTranslateX.value - radius },
        { translateY: forwardTranslateY.value - radius },
        { scale: rippleScale.value },
      ],
    };
  }, [
    forwardRippleRef,
    activeDirection,
    forwardBoxWidth,
    forwardBoxHeight,
    forwardTranslateX,
    forwardTranslateY,
    rippleOpacity,
    rippleScale,
  ]);

  // Inline animated styles to comply with hooks rules (no conditional/dynamic hook calls)
  const forwardAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: forwardOpacity.value,
      transform: [{ scale: scaleValue.value }],
    }),
    [forwardOpacity, scaleValue]
  );

  const backwardAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: backwardOpacity.value,
      transform: [{ scale: scaleValue.value }],
    }),
    [backwardOpacity, scaleValue]
  );

  return {
    doubleTapGesture,
    isDoubleTap,
    doubleTapValue,
    backwardRippleRef,
    forwardRippleRef,
    backwardAnimatedRipple,
    forwardAnimatedRipple,
    forwardAnimatedStyle,
    backwardAnimatedStyle,
  };
};

export default useDoubleTapGesture;
