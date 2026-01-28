import React, { useMemo } from 'react';
import { type PressableProps, View, StyleSheet } from 'react-native';
import { useVideo } from '../../providers';
import Ripple from 'react-native-material-ripple';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { PlatformUtils } from '../../utils/orientation';

interface BaseIconButtonProps extends PressableProps {
  IconComponent: React.ElementType;
  size?: number;
  color?: string;
  onTap: () => void;
}

/**
 * `BaseIconButton` is a foundational component for creating interactive icon buttons within the video player.
 * It wraps an `IconComponent` with a ripple effect provided by `react-native-material-ripple`,
 * and integrates with the player's theme for consistent sizing and coloring.
 *
 * @param {BaseIconButtonProps} props - The props for the BaseIconButton component.
 * @returns {React.ReactElement} A touchable icon button with a ripple effect.
 */
export const BaseIconButton = ({
  IconComponent,
  size,
  color,
  onTap,
  ...props
}: BaseIconButtonProps): React.ReactElement => {
  const {
    state: { theme },
  } = useVideo();

  const iconSize = size ?? theme.iconSizes.md;
  const iconColor = color || theme.colors.text;

  const InnerContent = (
    <View style={styles.iconContainer}>
      <IconComponent size={iconSize} color={iconColor} />
    </View>
  );

  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .numberOfTaps(1)
        .onEnd(() => {
          'worklet';
          runOnJS(onTap)();
        }),
    [onTap]
  );
  return (
    <GestureDetector gesture={gesture}>
      {PlatformUtils.isWeb() ? (
        <View>{InnerContent}</View>
      ) : (
        /* @ts-ignore */
        <Ripple
          rippleDuration={500}
          rippleColor={theme.colors.accent}
          // Ensure ripple respects the circular shape
          rippleContainerBorderRadius={50}
          // @ts-ignore
          style={styles.rippleContainer}
          {...props}>
          {InnerContent}
        </Ripple>
      )}
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  rippleContainer: {
    borderRadius: 50, // Matches the inner container
    overflow: 'hidden',
  },
  iconContainer: {
    padding: 10,
  },
});
