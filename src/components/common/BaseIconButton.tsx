import React, { type ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useVideo } from '../../providers';
import { BaseButton } from './BaseButton';

interface BaseIconButtonProps {
  IconComponent?: React.ElementType;
  icon?: ReactNode;
  size?: number;
  color?: string;
  onTap: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * A foundational component for creating interactive icon buttons within the video player.
 * Supports two icon patterns: `IconComponent` for components that accept `size`/`color` props,
 * and `icon` for pre-rendered elements from external icon libraries.
 *
 * @param {BaseIconButtonProps} props - The props for the component.
 * @returns {React.ReactElement} The base icon button component.
 */
export const BaseIconButton = ({
  IconComponent,
  icon,
  size,
  color,
  onTap,
  style,
}: BaseIconButtonProps): React.ReactElement => {
  const {
    state: { theme },
  } = useVideo();

  const iconSize = size ?? theme.iconSizes.md;
  const iconColor = color || theme.colors.iconNormal;

  return (
    <BaseButton onTap={onTap}>
      <View style={[styles.iconContainer, style]}>
        {icon ? icon : IconComponent ? <IconComponent size={iconSize} color={iconColor} /> : null}
      </View>
    </BaseButton>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    padding: 10,
  },
});
