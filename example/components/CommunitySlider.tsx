import Slider from '@react-native-community/slider';
import type { SliderProps } from 'react-native-video-toolkit';

/**
 * Uses the platform's native slider (`@react-native-community/slider`) for both the progress bar
 * and the volume control. The native slider has no buffered track, so `bufferedValue` is ignored.
 */
export function CommunitySlider({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  width,
  colors,
}: SliderProps) {
  return (
    <Slider
      style={{ width: width ?? '100%', height: 32 }}
      value={value}
      minimumValue={minimumValue}
      // The duration is 0 until the video loads; keep the range valid meanwhile.
      maximumValue={Math.max(maximumValue, minimumValue + 1)}
      onValueChange={onValueChange}
      onSlidingStart={onSlidingStart}
      onSlidingComplete={onSlidingComplete}
      minimumTrackTintColor={colors.active}
      maximumTrackTintColor={colors.inactive}
      thumbTintColor={colors.thumb}
    />
  );
}
