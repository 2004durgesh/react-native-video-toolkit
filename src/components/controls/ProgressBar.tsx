import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useProgress, useControlsVisibility } from '../../hooks';
import { useVideo, useVideoComponents } from '../../providers';

export interface ProgressBarProps {
  height?: number;
  thumbWidth?: number;
  style?: StyleProp<ViewStyle>;
  /** Callback fired when the user starts seeking. */
  onSeekStart?: () => void;
  /** Callback fired when the user finishes seeking. */
  onSeekEnd?: (time: number) => void;
  /** Callback fired when the seek position changes. */
  onSeek?: (time: number) => void;
}

/**
 * A progress bar that shows the current time and duration of the video.
 *
 * @param {ProgressBarProps} props - The props for the component.
 * @returns {React.ReactElement} - The progress bar component.
 */
export const ProgressBar = ({
  height = 4,
  thumbWidth = 12,
  style,
  onSeekStart,
  onSeekEnd,
  onSeek,
}: ProgressBarProps): React.ReactElement => {
  const { currentTime, duration, seek, playableDuration } = useProgress();
  const { showControls } = useControlsVisibility();
  const {
    state: { theme },
  } = useVideo();
  const { Slider } = useVideoComponents();

  const handleSlidingStart = () => {
    showControls();
    onSeekStart?.();
  };

  const handleSlidingComplete = (val: number) => {
    onSeekEnd?.(Math.round(val));
  };

  const handleValueChange = (val: number) => {
    const time = Math.round(val);
    seek(time);
    onSeek?.(time);
  };

  return (
    <View style={[styles.container, style]}>
      <Slider
        variant="progress"
        value={currentTime}
        minimumValue={0}
        maximumValue={duration}
        bufferedValue={playableDuration}
        onSlidingStart={handleSlidingStart}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        height={height}
        thumbWidth={thumbWidth}
        colors={{
          active: theme.colors.sliderTrackActive,
          inactive: theme.colors.sliderTrackInactive,
          buffered: theme.colors.sliderTrackCache,
          thumb: theme.colors.sliderThumb,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
