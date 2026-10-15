import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useVideoSelector } from '../../providers';
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
  // The player's width, since `event.x` is relative to the player, which needn't fill the window;
  // the window's width until the video has been laid out
  const windowWidth = useVideoSelector((state) => state.dimensions.width);
  const playerWidth = useVideoSelector((state) => state.videoLayout.width) || windowWidth;
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
          const side = event.x < playerWidth / 2 ? 'left' : 'right';
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
    [onLeftVerticalPan, onRightVerticalPan, onGlobalVerticalPan, onSwipeUp, onSwipeDown, playerWidth]
  );

  return {
    verticalPanGesture,
  };
};

export default usePanGesture;
