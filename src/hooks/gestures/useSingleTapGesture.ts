import { useMemo } from 'react';
import { useControlsVisibility } from '../media';
import { Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import type { UseSingleTapGestureProps } from '../../types';

/**
 * A hook for handling single tap gestures to toggle the visibility of the video controls.
 *
 * @returns An object with the following properties:
 * - `singleTapGesture`: The gesture handler for single taps.
 */
const TAP_MAX_DISTANCE = 10; // Maximum distance in pixels for a tap gesture

export const useSingleTapGesture = ({ onSingleTap }: UseSingleTapGestureProps) => {
  const { toggleControls } = useControlsVisibility();
  const singleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        // A moving finger is a swipe, not a tap; failing early lets the pan gestures take over
        .maxDistance(TAP_MAX_DISTANCE)
        .numberOfTaps(1)
        .onEnd((event) => {
          'worklet';
          scheduleOnRN(toggleControls);
          if (onSingleTap) {
            scheduleOnRN(onSingleTap, event);
          }
        }),
    [toggleControls, onSingleTap]
  );
  return { singleTapGesture };
};

export default useSingleTapGesture;
