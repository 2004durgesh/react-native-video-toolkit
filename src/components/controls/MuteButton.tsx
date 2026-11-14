import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useVolume } from '../../hooks';
import { VolumeUp, VolumeOff } from '../svgs';
import { BaseIconButton } from '../common';
import { useTestID } from '../../utils/testIDs';

export interface MuteButtonProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  renderMuteIcon?: () => React.ReactNode;
  renderUnmuteIcon?: () => React.ReactNode;
  /**
   * Identifies the button in end-to-end tests.
   * @default `video-mute-button`, with the player's `testID` in place of `video`
   */
  testID?: string;
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
  testID,
}: MuteButtonProps): React.ReactElement => {
  const buttonTestID = useTestID('mute-button', testID);
  const { muted, toggleMute } = useVolume();

  const MuteIcon = renderMuteIcon || VolumeOff;
  const UnmuteIcon = renderUnmuteIcon || VolumeUp;

  return (
    <BaseIconButton
      testID={buttonTestID}
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
