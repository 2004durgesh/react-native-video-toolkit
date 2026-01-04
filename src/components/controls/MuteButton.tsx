import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useVolume } from '../../hooks';
import { VolumeUp, VolumeOff } from '../svgs';
import { BaseIconButton } from '../../components/common/BaseIconButton';

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
  const { muted, toggleMute } = useVolume();

  const MuteIcon = renderMuteIcon || VolumeOff;
  const UnmuteIcon = renderUnmuteIcon || VolumeUp;

  return (
    <BaseIconButton
      IconComponent={muted ? MuteIcon : UnmuteIcon}
      size={size}
      color={color}
      style={[styles.muteButton, style]}
      onTap={toggleMute}
    />
  );
};

const styles = StyleSheet.create({
  muteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
