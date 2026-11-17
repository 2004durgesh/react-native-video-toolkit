import { useMemo } from 'react';
import { usePlayerWidth } from './usePlayerWidth';
import { usePanGesture as useGesturePan, type PanGestureConfig } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import type { UsePanGestureProps } from '../../types';

/** How far (px) or how fast (px/s) a vertical pan must end to count as a swipe. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 800;

/**
 * A hook for vertical pans on the player, reported for its left and right halves, and for swipes up
 * and down.
 *
 * @param props - The properties for the hook.
 * @returns An object with the following properties:
 * - `verticalPanGesture`: The gesture handler for vertical pans.
 */
export const usePanGesture = ({
  onLeftVerticalPan,
  onRightVerticalPan,
  onGlobalVerticalPan,
  onSwipeUp,
  onSwipeDown,
  enabled = true,
}: UsePanGestureProps) => {
  const playerWidth = usePlayerWidth();
  // Memoized: Gesture Handler sends the config to the native side whenever the object changes
  const config = useMemo<PanGestureConfig>(
    () => ({
      enabled,
      activeOffsetY: [-10, 10],
      onUpdate: (event) => {
        'worklet';
        if (onGlobalVerticalPan) {
          scheduleOnRN(onGlobalVerticalPan, event);
          return;
        }
        const side = event.x < playerWidth / 2 ? 'left' : 'right';
        if (side === 'left') {
          if (onLeftVerticalPan) scheduleOnRN(onLeftVerticalPan, event);
        } else {
          if (onRightVerticalPan) scheduleOnRN(onRightVerticalPan, event);
        }
      },
      onDeactivate: (event) => {
        'worklet';
        const isUp = event.translationY < -SWIPE_DISTANCE || event.velocityY < -SWIPE_VELOCITY;
        const isDown = event.translationY > SWIPE_DISTANCE || event.velocityY > SWIPE_VELOCITY;
        if (isUp && onSwipeUp) scheduleOnRN(onSwipeUp);
        else if (isDown && onSwipeDown) scheduleOnRN(onSwipeDown);
      },
    }),
    [enabled, onLeftVerticalPan, onRightVerticalPan, onGlobalVerticalPan, onSwipeUp, onSwipeDown, playerWidth]
  );
  const verticalPanGesture = useGesturePan(config);

  return {
    verticalPanGesture,
  };
};

export default usePanGesture;
