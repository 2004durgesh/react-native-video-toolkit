import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useVolume } from '../../../hooks';
import { Volume2, VolumeX } from 'lucide-react-native';
import { BaseIconButton } from '../../../components/common/BaseIconButton';
import { GestureDetector } from 'react-native-gesture-handler';

export interface MuteButtonProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  renderMuteIcon?: () => React.ReactNode;
  renderUnmuteIcon?: () => React.ReactNode;
}

/**
 * A button that mutes and unmutes the video.
 *
 * @param {MuteButtonProps} props - The props for the component.
 * @returns {React.ReactElement} - The mute button component.
 */
export const MuteButton = ({
  size,
  color,
  style,
  renderMuteIcon,
  renderUnmuteIcon,
}: MuteButtonProps): React.ReactElement => {
  const { muted, toggleMute, muteTapGesture } = useVolume();

  const MuteIcon = renderMuteIcon || VolumeX;
  const UnmuteIcon = renderUnmuteIcon || Volume2;

  return (
    <GestureDetector gesture={muteTapGesture}>
      <BaseIconButton
        IconComponent={muted ? MuteIcon : UnmuteIcon}
        size={size}
        color={color}
        style={[styles.muteButton, style]}
      />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  muteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
