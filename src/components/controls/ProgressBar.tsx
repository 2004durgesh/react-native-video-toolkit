import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useProgress } from '../../hooks';
import { useProgressActions } from '../../hooks/media/useProgress';
import { useVideoSelector, useVideoComponents } from '../../providers';
import { useControlsController } from '../../providers/ControlsController';
import { DefaultSlider, SliderView } from '../defaults/DefaultSlider';

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
 * Everything the slider gets except the position, shared by both ways of rendering the bar.
 */
const useProgressBarSlider = ({ height = 4, thumbWidth = 12, onSeekStart, onSeekEnd, onSeek }: ProgressBarProps) => {
  const { duration, seek } = useProgressActions();
  const { show: showControls } = useControlsController();
  const theme = useVideoSelector((state) => state.theme);

  return {
    minimumValue: 0,
    maximumValue: duration,
    onSlidingStart: () => {
      showControls();
      onSeekStart?.();
    },
    onSlidingComplete: (val: number) => {
      onSeekEnd?.(Math.round(val));
    },
    onValueChange: (val: number) => {
      const time = Math.round(val);
      seek(time);
      onSeek?.(time);
    },
    height,
    thumbWidth,
    colors: {
      active: theme.colors.sliderTrackActive,
      inactive: theme.colors.sliderTrackInactive,
      buffered: theme.colors.sliderTrackCache,
      thumb: theme.colors.sliderThumb,
    },
  };
};

/**
 * The default slider reads the progress store's shared values on the UI thread, so playback moves
 * the thumb without re-rendering the bar.
 */
const SharedValueProgressBar = (props: ProgressBarProps): React.ReactElement => {
  const slider = useProgressBarSlider(props);
  const { progressStore } = useProgressActions();

  return (
    <View style={[styles.container, props.style]}>
      <SliderView
        {...slider}
        progress={progressStore.shared.currentTime}
        cache={progressStore.shared.playableDuration}
      />
    </View>
  );
};

/**
 * A custom `Slider` takes the position as plain numbers, so this bar re-renders on every progress event.
 */
const PropsProgressBar = (props: ProgressBarProps): React.ReactElement => {
  const slider = useProgressBarSlider(props);
  const { currentTime, playableDuration } = useProgress();
  const { Slider } = useVideoComponents();

  return (
    <View style={[styles.container, props.style]}>
      <Slider {...slider} variant="progress" value={currentTime} bufferedValue={playableDuration} />
    </View>
  );
};

/**
 * A progress bar that shows the current time and duration of the video.
 *
 * @param {ProgressBarProps} props - The props for the component.
 * @returns {React.ReactElement} - The progress bar component.
 */
export const ProgressBar = (props: ProgressBarProps): React.ReactElement => {
  const { Slider } = useVideoComponents();
  return Slider === DefaultSlider ? <SharedValueProgressBar {...props} /> : <PropsProgressBar {...props} />;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
