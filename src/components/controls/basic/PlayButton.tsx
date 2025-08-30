import { StyleSheet } from 'react-native';
import { usePlayback } from '../../../hooks';
import { Pause, Play } from 'lucide-react-native';
import { BaseIconButton } from '../../../components/common/BaseIconButton';
import { GestureDetector } from 'react-native-gesture-handler';

export interface PlayButtonProps {
  size?: number;
  color?: string;
  style?: any;
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
  const { isPlaying, togglePlayPause, playTapGesture } = usePlayback();
  const PlayIcon = renderPlayIcon || Play;
  const PauseIcon = renderPauseIcon || Pause;

  return (
    <GestureDetector gesture={playTapGesture}>
      <BaseIconButton
        IconComponent={isPlaying ? PauseIcon : PlayIcon}
        size={size}
        color={color}
        style={[styles.playButton, style]}
      />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
