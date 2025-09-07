import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { usePlayback } from '../../hooks';
import { Pause, Play } from 'lucide-react-native';
import { BaseIconButton } from '../../components/common/BaseIconButton';

export interface PlayButtonProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  renderPlayIcon?: () => React.ReactNode;
  renderPauseIcon?: () => React.ReactNode;
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
}: PlayButtonProps): React.ReactElement => {
  const { isPlaying, togglePlayPause } = usePlayback();
  const PlayIcon = renderPlayIcon || Play;
  const PauseIcon = renderPauseIcon || Pause;

  return (
    <BaseIconButton
      IconComponent={isPlaying ? PauseIcon : PlayIcon}
      size={size}
      color={color}
      style={[styles.playButton, style]}
      onTap={togglePlayPause}
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
