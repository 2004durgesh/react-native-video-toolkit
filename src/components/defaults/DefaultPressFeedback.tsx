import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Ripple from 'react-native-material-ripple';
import { PlatformUtils } from '../../utils/orientation';
import type { PressFeedbackProps } from '../../types';

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
    // A pseudo-selector object owns its property, so a background from `style` becomes the resting value.
    const restingBackground = StyleSheet.flatten(style)?.backgroundColor ?? 'transparent';

    return (
      <Animated.View
        style={[
          styles.webContainer,
          style,
          {
            // Runs as a CSS transition, without re-rendering.
            backgroundColor: { 'default': restingBackground, ':hover': color, ':active': color },
            transform: { 'default': [{ scale: 1 }], ':active': [{ scale: 0.92 }] },
            transitionProperty: ['backgroundColor', 'transform'],
            transitionDuration: 150,
          },
        ]}
        {...viewProps}>
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
