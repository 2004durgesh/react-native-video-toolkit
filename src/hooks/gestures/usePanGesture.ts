import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useVideo } from '../../providers';
import { scheduleOnRN } from 'react-native-worklets';
import type { UsePanGestureProps } from '../../types';

/** How far (px) or how fast (px/s) a vertical pan must end to count as a swipe. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 800;

/**
 * A hook for handling pan gestures to control video playback.
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
}: UsePanGestureProps) => {
  const { state } = useVideo();
  const { dimensions } = state;
  const verticalPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onUpdate((event) => {
          'worklet';
          if (onGlobalVerticalPan) {
            scheduleOnRN(onGlobalVerticalPan, event);
            return;
          }
          const side = event.x < dimensions.width / 2 ? 'left' : 'right';
          if (side === 'left') {
            if (onLeftVerticalPan) scheduleOnRN(onLeftVerticalPan, event);
          } else {
            if (onRightVerticalPan) scheduleOnRN(onRightVerticalPan, event);
          }
        })
        .onEnd((event) => {
          'worklet';
          const isUp = event.translationY < -SWIPE_DISTANCE || event.velocityY < -SWIPE_VELOCITY;
          const isDown = event.translationY > SWIPE_DISTANCE || event.velocityY > SWIPE_VELOCITY;
          if (isUp && onSwipeUp) scheduleOnRN(onSwipeUp);
          else if (isDown && onSwipeDown) scheduleOnRN(onSwipeDown);
        }),
    [onLeftVerticalPan, onRightVerticalPan, onGlobalVerticalPan, onSwipeUp, onSwipeDown, dimensions.width]
  );

  return {
    verticalPanGesture,
  };
};

export default usePanGesture;
