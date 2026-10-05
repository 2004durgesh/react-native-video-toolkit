import React, { useMemo, type ReactNode } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useVideo, useVideoComponents } from '../../providers';
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
  const {
    state: { theme },
  } = useVideo();
  const { PressFeedback } = useVideoComponents();

  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .numberOfTaps(1)
        .onEnd(() => {
          'worklet';
          scheduleOnRN(onTap);
        }),
    [onTap]
  );

  return (
    <GestureDetector gesture={gesture}>
      <PressFeedback color={theme.colors.ripple} {...props}>
        {children}
      </PressFeedback>
    </GestureDetector>
  );
};
