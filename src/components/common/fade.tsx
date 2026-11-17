import React, { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ControlsFocusableContext } from '../../tv/TVFocus';
import { PlatformUtils } from '../../utils/platform';

const DURATION = 100;
const EASING = [0.25, 0.1, 0.25, 1] as const;

/** Props for the `Fade` component. @internal */
export interface FadeProps extends Pick<ViewProps, 'style' | 'testID' | 'onLayout'> {
  shown: boolean;
  /** How far it slides as it fades out. */
  offsetY?: number;
  /** The touches it takes while shown. Hidden, it takes none. */
  touches?: 'box-none' | 'auto' | 'none';
  children?: ReactNode;
}

const touchStyles = StyleSheet.create({
  'box-none': { pointerEvents: 'box-none' },
  'auto': { pointerEvents: 'auto' },
  'none': { pointerEvents: 'none' },
});

/**
 * Takes faded-out content out of screen readers (Android and iOS each have their own prop), so they
 * can't land on buttons nobody can see.
 */
const fadeAccessibility = (shown: boolean): ViewProps =>
  shown ? {} : { importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true };

const NativeFade = ({ shown, offsetY = 0, touches = 'box-none', style, children, ...props }: FadeProps) => {
  const fadeStyle = useAnimatedStyle(() => {
    const timing = { duration: DURATION, easing: Easing.bezierFn(...EASING) };
    return {
      opacity: withTiming(shown ? 1 : 0, timing),
      transform: [{ translateY: withTiming(shown ? 0 : offsetY, timing) }],
    };
  });
  return (
    <Animated.View
      style={[style, fadeStyle, touchStyles[shown ? touches : 'none']]}
      {...props}
      {...fadeAccessibility(shown)}>
      {PlatformUtils.isTV() ? (
        <ControlsFocusableContext.Provider value={shown}>{children}</ControlsFocusableContext.Provider>
      ) : (
        children
      )}
    </Animated.View>
  );
};

// Reanimated's web views drop `pointerEvents: 'box-none'`, which has no CSS value, so content shown
// again would keep `none` and its buttons would stop taking clicks. A plain view fades with CSS.
const webTransition = {
  transitionProperty: 'opacity, transform',
  transitionDuration: `${DURATION}ms`,
  transitionTimingFunction: `cubic-bezier(${EASING.join(', ')})`,
} as ViewStyle;

const WebFade = ({ shown, offsetY = 0, touches = 'box-none', style, children, ...props }: FadeProps) => (
  <View
    style={[
      style,
      webTransition,
      { opacity: shown ? 1 : 0, transform: [{ translateY: shown ? 0 : offsetY }] },
      touchStyles[shown ? touches : 'none'],
    ]}
    {...props}
    {...fadeAccessibility(shown)}>
    {children}
  </View>
);

/**
 * Content that fades in and out with `shown`, sliding `offsetY` as it goes: the controls, and
 * overlays that come and go with them, all fade this way. Faded out, it stays mounted, takes no
 * touches, and is hidden from screen readers and the TV remote.
 * @internal
 */
export const Fade = PlatformUtils.isWeb() ? WebFade : NativeFade;
