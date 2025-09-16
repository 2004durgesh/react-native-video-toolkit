import { useMemo } from 'react';
import { useControlsVisibility } from '../media';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { UseSingleTapGestureProps } from '../../types';

/**
 * A hook for handling single tap gestures to toggle the visibility of the video controls.
 *
 * @returns An object with the following properties:
 * - `singleTapGesture`: The gesture handler for single taps.
 */
export const useSingleTapGesture = ({ onSingleTap }: UseSingleTapGestureProps) => {
  const { toggleControls } = useControlsVisibility();
  const singleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .numberOfTaps(1)
        .onEnd((event) => {
          'worklet';
          runOnJS(toggleControls)();
          if (onSingleTap) {
            runOnJS(onSingleTap)(event);
          }
        }),
    [toggleControls, onSingleTap]
  );
  return { singleTapGesture };
};

export default useSingleTapGesture;
