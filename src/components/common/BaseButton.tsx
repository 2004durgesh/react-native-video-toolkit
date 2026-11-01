import React, { useMemo, type ReactNode } from 'react';
import { GestureDetector, useTapGesture, type TapGestureConfig } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useVideoSelector, useVideoComponents } from '../../providers';
import type { PressFeedbackProps } from '../../types';

interface BaseButtonProps extends Omit<PressFeedbackProps, 'children' | 'color'> {
  children: ReactNode;
  onTap: () => void;
}

/**
 * `BaseButton` is a foundational component for creating interactive buttons within the video player.
 * It handles the tap gesture and wraps its content in the `PressFeedback` from `VideoProvider`'s
 * `components` (a material ripple by default) for a consistent user experience.
 *
 * @param {BaseButtonProps} props - The props for the BaseButton component.
 * @returns {React.ReactElement} A touchable button with press feedback.
 */
export const BaseButton = ({ children, onTap, ...props }: BaseButtonProps): React.ReactElement => {
  const theme = useVideoSelector((state) => state.theme);
  const { PressFeedback } = useVideoComponents();

  // Memoized: Gesture Handler sends the config to the native side whenever the object changes
  const config = useMemo<TapGestureConfig>(
    () => ({
      maxDuration: 250,
      numberOfTaps: 1,
      onDeactivate: () => {
        'worklet';
        scheduleOnRN(onTap);
      },
    }),
    [onTap]
  );
  const gesture = useTapGesture(config);

  return (
    <GestureDetector gesture={gesture}>
      <PressFeedback color={theme.colors.ripple} {...props}>
        {children}
      </PressFeedback>
    </GestureDetector>
  );
};
