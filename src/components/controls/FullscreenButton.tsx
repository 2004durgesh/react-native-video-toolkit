import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useFullscreen } from '../../hooks';
import { Maximize, Minimize } from 'lucide-react-native';
import { BaseIconButton } from '..';

export interface FullscreenButtonProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  renderEnterIcon?: () => React.ReactNode;
  renderExitIcon?: () => React.ReactNode;
}

/**
 * A button that toggles fullscreen mode.
 *
 * @param {FullscreenButtonProps} props - The props for the component.
 * @returns {React.ReactElement} - The fullscreen button component.
 */
export const FullscreenButton = ({
  size,
  color,
  style,
  renderEnterIcon,
  renderExitIcon,
}: FullscreenButtonProps): React.ReactElement => {
  const { fullscreen, toggleFullscreen } = useFullscreen();

  const EnterIcon = renderEnterIcon || Maximize;
  const ExitIcon = renderExitIcon || Minimize;

  return (
    <BaseIconButton
      IconComponent={fullscreen ? ExitIcon : EnterIcon}
      size={size}
      color={color}
      style={[styles.fullscreenButton, style]}
      onTap={toggleFullscreen}
    />
  );
};

const styles = StyleSheet.create({
  fullscreenButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
