import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useVolume } from '../../hooks';
import { useVideo, useVideoComponents } from '../../providers';

export interface VolumeControlProps {
  orientation?: 'horizontal' | 'vertical';
  width?: number;
  height?: number;
  thumbWidth?: number;
  trackColor?: string;
  progressColor?: string;
  style?: StyleProp<ViewStyle>;
  /** Callback fired when the volume changes. */
  onVolumeChange?: (volume: number) => void;
}

/**
 * `VolumeControl` is a slider component that allows users to adjust the video's volume.
 * It provides a visual representation of the current volume level and allows for interactive changes.
 * It renders the `Slider` from `VideoProvider`'s `components` (`react-native-awesome-slider` by default)
 * and integrates with the video player's volume state.
 *
 * @param {VolumeControlProps} props - The props for the VolumeControl component.
 * @returns {React.ReactElement} A slider component for volume control.
 */
export const VolumeControl = ({
  orientation = 'horizontal',
  width = 100,
  height = 4,
  thumbWidth = 12,
  style,
  onVolumeChange,
}: VolumeControlProps): React.ReactElement => {
  const { volume, setVolume } = useVolume();
  const {
    state: { theme },
  } = useVideo();
  const { Slider } = useVideoComponents();

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
    onVolumeChange?.(newVolume);
  };

  return (
    <View style={style}>
      <Slider
        variant="volume"
        value={volume}
        minimumValue={0}
        maximumValue={1}
        onValueChange={updateVolume}
        height={height}
        thumbWidth={thumbWidth}
        width={width}
        colors={{
          active: theme.colors.sliderTrackActive,
          inactive: theme.colors.sliderTrackInactive,
          thumb: theme.colors.sliderThumb,
        }}
      />
    </View>
  );
};
