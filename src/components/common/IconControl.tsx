import React, { isValidElement } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { IconProps } from '../../types';
import type { TVFocusTarget } from '../../tv/TVFocus';
import { useTestID } from '../../utils/testIDs';
import { BaseIconButton } from './BaseIconButton';

/**
 * An icon for a control button: a component the toolkit renders with `size` and `color`, or an
 * element you've already sized.
 */
export type IconRenderer = React.ComponentType<IconProps> | React.ReactElement;

/** What every icon control button takes. */
export interface IconControlProps {
  /** The icon's size, in px. @default theme.iconSizes.md */
  size?: number;
  /** The icon's color. @default theme.colors.iconNormal */
  color?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * Identifies the button in end-to-end tests.
   * @default `video-<part>`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

/**
 * The toolkit's icon control buttons (play, mute, fullscreen...), which differ only in their icon
 * and what a tap does.
 * @internal
 */
export const IconControl = ({
  part,
  icon,
  label,
  onTap,
  tvFocusTarget,
  size,
  color,
  style,
  testID,
}: IconControlProps & {
  /** The button's part of its test ID: `play-button`. */
  part: string;
  icon: IconRenderer;
  /** What a screen reader announces. */
  label: string;
  onTap: () => void;
  /** Where the TV remote lands for this control, when the player sends it there. */
  tvFocusTarget?: TVFocusTarget;
}): React.ReactElement => (
  <BaseIconButton
    testID={useTestID(part, testID)}
    icon={isValidElement(icon) ? icon : undefined}
    IconComponent={isValidElement(icon) ? undefined : (icon as React.ComponentType<IconProps>)}
    size={size}
    color={color}
    style={[styles.control, style]}
    onTap={onTap}
    tvFocusTarget={tvFocusTarget}
    accessibilityLabel={label}
  />
);

const styles = StyleSheet.create({
  control: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
