import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { usePlayback } from '../../hooks';
import { Pause, Play } from '../svgs';
import { BaseIconButton } from '../common';
import { useTestID } from '../../utils/testIDs';

export interface PlayButtonProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  renderPlayIcon?: () => React.ReactNode;
  renderPauseIcon?: () => React.ReactNode;
  /**
   * Identifies the button in end-to-end tests.
   * @default `video-play-button`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

/**
 * A button that plays and pauses the video.
 *
 * @param {PlayButtonProps} props - The props for the component.
 * @returns {React.ReactElement} - The play button component.
 */
export const PlayButton = ({
  size,
  color,
  style,
  renderPlayIcon,
  renderPauseIcon,
  testID,
}: PlayButtonProps): React.ReactElement => {
  const buttonTestID = useTestID('play-button', testID);
  const { isPlaying, togglePlayPause } = usePlayback();
  const PlayIcon = renderPlayIcon || Play;
  const PauseIcon = renderPauseIcon || Pause;

  return (
    <BaseIconButton
      testID={buttonTestID}
      IconComponent={isPlaying ? PauseIcon : PlayIcon}
      size={size}
      color={color}
      style={[styles.playButton, style]}
      onTap={togglePlayPause}
      // The TV remote lands here when the controls come up
      tvFocusTarget="play"
    />
  );
};

const styles = StyleSheet.create({
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
