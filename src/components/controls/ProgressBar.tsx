import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { Slider } from 'react-native-awesome-slider';
import { useProgress, useControlsVisibility } from '../../hooks';
import { useVideo } from '../../providers';

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

  // Shared values for the slider - use useDerivedValue to react to changes
  const progress = useDerivedValue(() => currentTime);
  const min = useSharedValue(0);
  const max = useDerivedValue(() => duration);
  const cache = useDerivedValue(() => playableDuration);

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
        progress={progress}
        minimumValue={min}
        maximumValue={max}
        cache={cache}
        onSlidingStart={handleSlidingStart}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        theme={{
          minimumTrackTintColor: theme.colors.sliderTrackActive,
          maximumTrackTintColor: theme.colors.sliderTrackInactive,
          bubbleBackgroundColor: theme.colors.sliderThumb,
          cacheTrackTintColor: theme.colors.sliderTrackCache,
        }}
        renderBubble={() => null}
        thumbWidth={thumbWidth}
        containerStyle={{
          height,
          borderRadius: height / 2,
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
