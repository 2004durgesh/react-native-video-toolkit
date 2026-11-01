import { useMemo } from 'react';
import { useControlsController } from '../../providers/ControlsController';
import { useTapGesture, type TapGestureConfig } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import type { UseSingleTapGestureProps } from '../../types';

/**
 * A hook for handling single tap gestures to toggle the visibility of the video controls.
 *
 * @returns An object with the following properties:
 * - `singleTapGesture`: The gesture handler for single taps.
 */
const TAP_MAX_DISTANCE = 10; // Maximum distance in pixels for a tap gesture

export const useSingleTapGesture = ({ onSingleTap, enabled = true }: UseSingleTapGestureProps) => {
  // The controller directly: `useControlsVisibility()` would re-render this on every toggle
  const { toggle: toggleControls } = useControlsController();
  // Memoized: Gesture Handler sends the config to the native side whenever the object changes
  const config = useMemo<TapGestureConfig>(
    () => ({
      enabled,
      maxDuration: 250,
      // A moving finger is a swipe, not a tap; failing early lets the pan gestures take over
      maxDistance: TAP_MAX_DISTANCE,
      numberOfTaps: 1,
      onDeactivate: (event) => {
        'worklet';
        scheduleOnRN(toggleControls);
        if (onSingleTap) {
          scheduleOnRN(onSingleTap, event);
        }
      },
    }),
    [enabled, toggleControls, onSingleTap]
  );
  const singleTapGesture = useTapGesture(config);
  return { singleTapGesture };
};

export default useSingleTapGesture;
