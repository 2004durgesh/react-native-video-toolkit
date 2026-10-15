import { useCallback, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { UseDoubleTapGestureProps } from '../../types';
import { useProgressStore } from '../../providers/ProgressStore';
import { useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';

const TAP_MAX_DISTANCE = 10; // Maximum distance in pixels for a tap gesture

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
  const { width: windowWidth } = useWindowDimensions();
  // Which half was tapped is judged against the player, since `event.x` is relative to it and it
  // needn't fill the window; the window's width until the video has been laid out
  const playerWidth = useVideoSelector((state) => state.videoLayout.width) || windowWidth;
  const progressStore = useProgressStore();
  const store = useVideoStore();
  const [isDoubleTap, setIsDoubleTap] = useState(false);
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

  // Radius that covers each ripple container, measured once per tap rather than on every frame
  const forwardRadius = useSharedValue(0);
  const backwardRadius = useSharedValue(0);

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
        scheduleOnRN(resetConsecutiveCount, direction);
      }, 1000);
    },
    [forwardOpacity, backwardOpacity, scaleValue, resetConsecutiveCount]
  );

  const handleSeek = useCallback(
    (direction: 'forward' | 'backward') => {
      if (!videoRef?.current) return;

      const now = Date.now();
      const timeSinceLastTap = now - consecutiveTapCount.current.lastTapTime;
      const isConsecutive = timeSinceLastTap < 500 && direction === consecutiveTapCount.current.lastDirection;

      // From the progress store, which already has the previous tap's seek, so quick taps add up.
      // The player's own position can lag until a seek lands, and asking for it is a native round trip.
      const { currentTime } = progressStore.getSnapshot();
      const { duration } = store.getState();
      const seekAmount = direction === 'forward' ? doubleTapSeekInterval : -doubleTapSeekInterval;
      const newPosition = Math.max(
        0,
        duration > 0 ? Math.min(currentTime + seekAmount, duration) : currentTime + seekAmount
      );

      videoRef.current.seek(newPosition);
      progressStore.update({ currentTime: newPosition });

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

      showTapAnimation(direction);
    },
    [videoRef, doubleTapSeekInterval, showTapAnimation, progressStore, store]
  );

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .maxDistance(TAP_MAX_DISTANCE)
        .onStart((event) => {
          scheduleOnRN(setIsDoubleTap, true);
          if (onDoubleTapSeekStart) {
            scheduleOnRN(onDoubleTapSeekStart);
          }

          const midPoint = playerWidth / 2;
          const direction = event.x < midPoint ? 'backward' : 'forward';
          activeDirection.value = direction;

          // The tap inside the ripple's container, which is offset from the player, so the ripple
          // grows from the finger; and the radius that covers the container
          const box = measure(direction === 'forward' ? forwardRippleRef : backwardRippleRef);
          const originX = box ? box.x : direction === 'forward' ? midPoint : 0;
          const originY = box ? box.y : 0;
          const radius = box ? Math.sqrt(box.width ** 2 + box.height ** 2) : 0;
          if (direction === 'forward') {
            forwardTranslateX.value = event.x - originX;
            forwardTranslateY.value = event.y - originY;
            if (radius) forwardRadius.value = radius;
          } else {
            backwardTranslateX.value = event.x - originX;
            backwardTranslateY.value = event.y - originY;
            if (radius) backwardRadius.value = radius;
          }

          // Reset and start ripple animation
          rippleScale.value = 0;
          rippleScale.value = withTiming(1, { duration: 500 });
          rippleOpacity.value = 0.4;

          scheduleOnRN(handleSeek, direction);
        })
        .onEnd(() => {
          scheduleOnRN(setIsDoubleTap, false);
          if (onDoubleTapSeekEnd) {
            scheduleOnRN(onDoubleTapSeekEnd);
          }
          rippleOpacity.value = withTiming(0, { duration: 500 });
        }),
    [
      onDoubleTapSeekStart,
      activeDirection,
      forwardTranslateX,
      forwardTranslateY,
      backwardTranslateX,
      backwardTranslateY,
      forwardRippleRef,
      backwardRippleRef,
      forwardRadius,
      backwardRadius,
      rippleScale,
      rippleOpacity,
      handleSeek,
      onDoubleTapSeekEnd,
      playerWidth,
    ]
  );

  const backwardAnimatedRipple = useAnimatedStyle(() => {
    const radius = backwardRadius.value;
    if (activeDirection.value !== 'backward' || radius === 0) {
      return { opacity: 0 };
    }
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
  }, [activeDirection, backwardRadius, backwardTranslateX, backwardTranslateY, rippleOpacity, rippleScale]);

  const forwardAnimatedRipple = useAnimatedStyle(() => {
    const radius = forwardRadius.value;
    if (activeDirection.value !== 'forward' || radius === 0) {
      return { opacity: 0 };
    }
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
  }, [activeDirection, forwardRadius, forwardTranslateX, forwardTranslateY, rippleOpacity, rippleScale]);

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
