import React, { type ReactNode } from 'react';
import { StyleSheet, type ViewProps } from 'react-native';
import { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ControlsFocusableContext } from '../../tv/TVFocus';
import { PlatformUtils, webDependencies } from '../../utils/platform';

/**
 * Fades content in and out with `shown`, sliding it `offsetY` as it goes: the controls, and overlays
 * that come and go with them, all fade the same way.
 * @internal
 */
export const useFadeStyle = (shown: boolean, offsetY = 0) =>
  useAnimatedStyle(
    () => {
      const timing = { duration: 100, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) };
      return {
        opacity: withTiming(shown ? 1 : 0, timing),
        transform: [{ translateY: withTiming(shown ? 0 : offsetY, timing) }],
      };
    },
    webDependencies([shown, offsetY])
  );

/**
 * Which touches faded content takes: the given ones while shown, none while hidden. Faded-out
 * content stays mounted, and would otherwise swallow taps meant for the player.
 * @internal
 */
export const fadeTouchStyle = (shown: boolean, touches: 'box-none' | 'auto' | 'none' = 'box-none') =>
  touchStyles[shown ? touches : 'none'];

/**
 * Takes faded-out content out of screen readers (Android and iOS each have their own prop), so they
 * can't land on buttons nobody can see.
 * @internal
 */
export const fadeAccessibility = (shown: boolean): ViewProps =>
  shown ? {} : { importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true };

/**
 * Children that can't take the TV remote's focus while faded out.
 * @internal
 */
export const FocusableWhenShown = ({ shown, children }: { shown: boolean; children: ReactNode }) =>
  PlatformUtils.isTV() ? (
    <ControlsFocusableContext.Provider value={shown}>{children}</ControlsFocusableContext.Provider>
  ) : (
    <>{children}</>
  );

const touchStyles = StyleSheet.create({
  'box-none': { pointerEvents: 'box-none' },
  'auto': { pointerEvents: 'auto' },
  'none': { pointerEvents: 'none' },
});
