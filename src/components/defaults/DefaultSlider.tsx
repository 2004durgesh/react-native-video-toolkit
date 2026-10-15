import { useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { Slider } from 'react-native-awesome-slider';
import type { SliderProps } from '../../types';

/**
 * Props for {@link SliderView}: the slider props, with the value and the buffered value as shared
 * values.
 * @internal
 */
export interface SliderViewProps extends Omit<SliderProps, 'variant' | 'value' | 'bufferedValue'> {
  progress: SharedValue<number>;
  cache?: SharedValue<number>;
}

const renderNoBubble = () => null;

/**
 * The default slider's view, driven by shared values. `ProgressBar` passes the progress store's
 * shared values, so the thumb follows playback on the UI thread without a React render.
 * @internal
 */
export const SliderView = ({
  progress,
  cache,
  minimumValue,
  maximumValue,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  height,
  thumbWidth,
  width,
  colors,
}: SliderViewProps): React.ReactElement => {
  const min = useDerivedValue(() => minimumValue, [minimumValue]);
  const max = useDerivedValue(() => maximumValue, [maximumValue]);
  const theme = useMemo(
    () => ({
      minimumTrackTintColor: colors.active,
      maximumTrackTintColor: colors.inactive,
      bubbleBackgroundColor: colors.thumb,
      cacheTrackTintColor: colors.buffered,
    }),
    [colors.active, colors.inactive, colors.thumb, colors.buffered]
  );
  const containerStyle = useMemo(() => ({ height, borderRadius: height / 2 }), [height]);
  // A given width goes on the slider's own view, which awesome-slider measures to map touches; the
  // track fills it. On the track, the touch area stayed wider than the track.
  const sliderStyle = useMemo(() => (width !== undefined ? { width } : undefined), [width]);

  return (
    <Slider
      progress={progress}
      minimumValue={min}
      maximumValue={max}
      cache={cache}
      onSlidingStart={onSlidingStart}
      onSlidingComplete={onSlidingComplete}
      onValueChange={onValueChange}
      theme={theme}
      renderBubble={renderNoBubble}
      thumbWidth={thumbWidth}
      containerStyle={containerStyle}
      style={sliderStyle}
    />
  );
};

/**
 * The toolkit's default `Slider`, built on `react-native-awesome-slider`.
 *
 * @param {SliderProps} props - The props for the slider.
 * @returns {React.ReactElement} The slider component.
 */
export const DefaultSlider = ({
  value,
  bufferedValue,
  variant: _variant,
  ...rest
}: SliderProps): React.ReactElement => {
  // react-native-awesome-slider works with shared values; derive them from the plain props.
  const progress = useDerivedValue(() => value, [value]);
  const cache = useDerivedValue(() => bufferedValue ?? 0, [bufferedValue]);

  return <SliderView {...rest} progress={progress} cache={bufferedValue !== undefined ? cache : undefined} />;
};
