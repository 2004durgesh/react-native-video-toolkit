import React, { useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { GestureDetector, useTapGesture, type TapGestureConfig } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useVideoSelector, useVideoComponents } from '../../providers';
import type { PressFeedbackProps } from '../../types';
import {
  ControlsFocusableContext,
  DEFAULT_TV_FOCUS_COLOR,
  TVFocusContext,
  tvPreferredFocus,
  useTVPreferredFocus,
  type TVFocusTarget,
} from '../../tv/TVFocus';
import { PlatformUtils } from '../../utils/platform';

interface BaseButtonProps extends Omit<PressFeedbackProps, 'children' | 'color'> {
  children: ReactNode;
  onTap: () => void;
  /**
   * On TV, the button the remote focuses when it comes up: the play button, or "Play now".
   * @internal
   */
  tvFocusTarget?: TVFocusTarget;
}

/** Taps, on phones, tablets and the web. */
const TouchBaseButton = ({ children, onTap, tvFocusTarget: _tvFocusTarget, ...props }: BaseButtonProps) => {
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

/**
 * The remote, on TV: a gesture tap never fires there, and a remote needs a button it can focus and
 * see focused. Select presses it. The press feedback is left out, as it's a touchable of its own that
 * would take the focus.
 */
const TVBaseButton = ({ children, onTap, tvFocusTarget, style, ...props }: BaseButtonProps) => {
  const tvFocusColor = useVideoSelector((state) => state.theme.colors.tvFocus);
  const focus = useContext(TVFocusContext);
  const focusable = useContext(ControlsFocusableContext);
  const preferred = useTVPreferredFocus(tvFocusTarget);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      {...props}
      focusable={focusable}
      {...tvPreferredFocus(focusable && preferred)}
      onPress={onTap}
      onFocus={() => {
        setFocused(true);
        focus?.setHolder('button');
      }}
      onBlur={() => {
        setFocused(false);
        focus?.setHolder(null);
      }}
      style={[
        styles.tvButton,
        style,
        focused && [styles.tvFocused, { backgroundColor: tvFocusColor ?? DEFAULT_TV_FOCUS_COLOR }],
      ]}>
      {children}
    </Pressable>
  );
};

/**
 * `BaseButton` is a foundational component for creating interactive buttons within the video player.
 * It handles the tap gesture and wraps its content in the `PressFeedback` from `VideoProvider`'s
 * `components` (a material ripple by default) for a consistent user experience. On TV it's a button
 * the remote can focus, highlighted while focused.
 *
 * @param {BaseButtonProps} props - The props for the BaseButton component.
 * @returns {React.ReactElement} A touchable button with press feedback.
 */
export const BaseButton: (props: BaseButtonProps) => React.ReactElement = PlatformUtils.isTV()
  ? TVBaseButton
  : TouchBaseButton;

const styles = StyleSheet.create({
  tvButton: {
    borderRadius: 999,
  },
  tvFocused: {
    transform: [{ scale: 1.1 }],
  },
});
