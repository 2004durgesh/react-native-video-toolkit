import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Slider } from 'react-native-awesome-slider';
import { useProgress, useControlsVisibility } from '../../../hooks';
import { useVideo } from '../../../providers';

export interface ProgressBarProps {
  height?: number;
  thumbWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A progress bar that shows the current time and duration of the video.
 *
 * @param {ProgressBarProps} props - The props for the component.
 * @returns {React.ReactElement} - The progress bar component.
 */
export const ProgressBar = ({ height = 4, thumbWidth = 12, style }: ProgressBarProps): React.ReactElement => {
  const { currentTime, duration, seek } = useProgress();
  const { showControls } = useControlsVisibility();
  const {
    state: { theme },
  } = useVideo();

  // Shared values for the slider
  const progress = useSharedValue(currentTime);
  const min = useSharedValue(0);
  const max = useSharedValue(duration);

  // Update slider when state changes
  progress.value = currentTime;
  max.value = duration;

  const trackBg = theme.colors.secondary;
  const progressBg = theme.colors.primary;

  const handleSlidingStart = () => {
    showControls();
  };

  const handleValueChange = (val: number) => {
    seek(Math.round(val));
  };

  return (
    <View style={[styles.container, style]}>
      <Slider
        progress={progress}
        minimumValue={min}
        maximumValue={max}
        onSlidingStart={handleSlidingStart}
        onValueChange={handleValueChange}
        theme={{
          minimumTrackTintColor: progressBg,
          maximumTrackTintColor: trackBg,
          bubbleBackgroundColor: progressBg,
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
