import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { PlatformUtils } from '../../utils/orientation';
import type { PressFeedbackProps } from '../../types';

/**
 * The toolkit's default `PressFeedback`: a material ripple on native, and no feedback on web.
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
    return (
      <View style={style} {...viewProps}>
        {children}
      </View>
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
});
