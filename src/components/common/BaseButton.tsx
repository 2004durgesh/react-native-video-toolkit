import React, { useMemo, type ReactNode } from 'react';
import { type PressableProps, View, StyleSheet } from 'react-native';
import { useVideo } from '../../providers';
import Ripple from 'react-native-material-ripple';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { PlatformUtils } from '../../utils/orientation';

interface BaseButtonProps extends PressableProps {
  children: ReactNode;
  onTap: () => void;
}

/**
 * `BaseButton` is a foundational component for creating interactive buttons within the video player.
 * It provides a ripple effect and gesture handling for a consistent user experience.
 *
 * @param {BaseButtonProps} props - The props for the BaseButton component.
 * @returns {React.ReactElement} A touchable button with a ripple effect.
 */
export const BaseButton = ({ children, onTap, ...props }: BaseButtonProps): React.ReactElement => {
  const {
    state: { theme },
  } = useVideo();

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
      {PlatformUtils.isWeb() ? (
        <View>{children}</View>
      ) : (
        /* @ts-ignore */
        <Ripple
          rippleDuration={500}
          rippleColor={theme.colors.ripple}
          rippleContainerBorderRadius={50}
          // @ts-ignore
          style={styles.rippleContainer}
          {...props}>
          {children}
        </Ripple>
      )}
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  rippleContainer: {
    borderRadius: 50,
    overflow: 'hidden',
  },
});
