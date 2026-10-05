import { useDerivedValue } from 'react-native-reanimated';
import { Slider } from 'react-native-awesome-slider';
import type { SliderProps } from '../../types';

/**
 * The toolkit's default `Slider`, built on `react-native-awesome-slider`.
 *
 * @param {SliderProps} props - The props for the slider.
 * @returns {React.ReactElement} The slider component.
 */
export const DefaultSlider = ({
  value,
  minimumValue,
  maximumValue,
  bufferedValue,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  height,
  thumbWidth,
  width,
  colors,
}: SliderProps): React.ReactElement => {
  // react-native-awesome-slider works with shared values; derive them from the plain props.
  const progress = useDerivedValue(() => value, [value]);
  const min = useDerivedValue(() => minimumValue, [minimumValue]);
  const max = useDerivedValue(() => maximumValue, [maximumValue]);
  const cache = useDerivedValue(() => bufferedValue ?? 0, [bufferedValue]);

  return (
    <Slider
      progress={progress}
      minimumValue={min}
      maximumValue={max}
      cache={bufferedValue !== undefined ? cache : undefined}
      onSlidingStart={onSlidingStart}
      onSlidingComplete={onSlidingComplete}
      onValueChange={onValueChange}
      theme={{
        minimumTrackTintColor: colors.active,
        maximumTrackTintColor: colors.inactive,
        bubbleBackgroundColor: colors.thumb,
        cacheTrackTintColor: colors.buffered,
      }}
      renderBubble={() => null}
      thumbWidth={thumbWidth}
      containerStyle={{
        height,
        width,
        borderRadius: height / 2,
      }}
    />
  );
};
