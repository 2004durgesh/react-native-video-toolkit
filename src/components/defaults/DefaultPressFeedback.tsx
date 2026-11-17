import { StyleSheet, type ColorValue, type ViewStyle } from 'react-native';
import Animated, { type CSSStyle } from 'react-native-reanimated';
import Ripple from 'react-native-material-ripple';
import { PlatformUtils } from '../../utils/platform';
import type { PressFeedbackProps } from '../../types';

/**
 * Builds hover and press feedback that runs natively (as a CSS transition on web), without
 * re-rendering: a background in `color` and a smaller scale while pressed.
 *
 * A pseudo-selector object owns its property, so pass a background from the view's own `style` as
 * `resting`, or it's lost.
 *
 * @param {ColorValue} resting - The background when neither hovered nor pressed.
 * @param {ColorValue} color - The background while hovered or pressed.
 * @param {number} scale - The scale while pressed.
 * @param {number} duration - How long the change takes, in ms.
 * @returns {CSSStyle<ViewStyle>} A style to put after the view's own.
 * @internal
 */
export const pressFeedbackStyle = (
  resting: ColorValue,
  color: ColorValue,
  scale: number,
  duration: number
): CSSStyle<ViewStyle> => ({
  backgroundColor: { 'default': resting, ':hover': color, ':active': color },
  transform: { 'default': [{ scale: 1 }], ':active': [{ scale }] },
  transitionProperty: ['backgroundColor', 'transform'],
  transitionDuration: duration,
});

/**
 * The toolkit's default `PressFeedback`: a material ripple on native, and a hover and press tint
 * on web.
 *
 * @param {PressFeedbackProps} props - The props for the press feedback.
 * @returns {React.ReactElement} The press feedback wrapper.
 */
export const DefaultPressFeedback = ({
  children,
  color,
  style,
  ...viewProps
}: PressFeedbackProps): React.ReactElement => {
  if (PlatformUtils.isWeb()) {
    const resting = StyleSheet.flatten(style)?.backgroundColor ?? 'transparent';
    return (
      <Animated.View style={[styles.webContainer, style, pressFeedbackStyle(resting, color, 0.92, 150)]} {...viewProps}>
        {children}
      </Animated.View>
    );
  }

  return (
    // @ts-ignore react-native-material-ripple's types don't include every View prop
    <Ripple
      rippleDuration={500}
      rippleColor={color}
      rippleContainerBorderRadius={50}
      // @ts-ignore
      style={style ?? styles.rippleContainer}
      {...viewProps}>
      {children}
    </Ripple>
  );
};

const styles = StyleSheet.create({
  rippleContainer: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  webContainer: {
    borderRadius: 50,
  },
});
