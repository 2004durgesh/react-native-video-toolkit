import { StyleSheet } from 'react-native';
import { useFullscreen } from '../../../hooks';
import { Maximize, Minimize } from 'lucide-react-native';
import { BaseIconButton } from '../../../components';
import { GestureDetector } from 'react-native-gesture-handler';

export interface FullscreenButtonProps {
  size?: number;
  color?: string;
  style?: any;
  renderEnterIcon?: () => React.ReactNode;
  renderExitIcon?: () => React.ReactNode;
  onPress?: () => void;
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
  onPress,
}: FullscreenButtonProps): React.ReactElement => {
  const { fullscreen, toggleFullscreen, fullscreenTapGesture } = useFullscreen();

  const EnterIcon = renderEnterIcon || Maximize;
  const ExitIcon = renderExitIcon || Minimize;

  return (
    <GestureDetector gesture={fullscreenTapGesture}>
      <BaseIconButton
        IconComponent={fullscreen ? ExitIcon : EnterIcon}
        size={size}
        color={color}
        // onPress={() => {
        //   (toggleFullscreen(), onPress && onPress());
        // }}
        style={[styles.fullscreenButton, style]}
      />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  fullscreenButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
