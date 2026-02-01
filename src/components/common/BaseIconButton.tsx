import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useVideo } from '../../providers';
import { BaseButton } from './BaseButton';

interface BaseIconButtonProps {
  IconComponent: React.ElementType;
  size?: number;
  color?: string;
  onTap: () => void;
  style?: StyleProp<ViewStyle>;
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
  style,
}: BaseIconButtonProps): React.ReactElement => {
  const {
    state: { theme },
  } = useVideo();

  const iconSize = size ?? theme.iconSizes.md;
  const iconColor = color || theme.colors.text;

  return (
    <BaseButton onTap={onTap}>
      <View style={[styles.iconContainer, style]}>
        <IconComponent size={iconSize} color={iconColor} />
      </View>
    </BaseButton>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    padding: 10,
  },
});
