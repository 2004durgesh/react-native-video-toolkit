import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useVolume } from '../../hooks';
import { useVideoSelector, useVideoComponents } from '../../providers';
import { useTestID } from '../../utils/testIDs';

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
  /**
   * Identifies the control in end-to-end tests.
   * @default `video-volume`, with the player's `testID` in place of `video`
   */
  testID?: string;
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
  trackColor,
  progressColor,
  style,
  onVolumeChange,
  testID,
}: VolumeControlProps): React.ReactElement => {
  const controlTestID = useTestID('volume', testID);
  const { volume, setVolume } = useVolume();
  const theme = useVideoSelector((state) => state.theme);
  const { Slider } = useVideoComponents();

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
    onVolumeChange?.(newVolume);
  };

  return (
    <View style={style} testID={controlTestID}>
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
          active: progressColor ?? theme.colors.sliderTrackActive,
          inactive: trackColor ?? theme.colors.sliderTrackInactive,
          thumb: theme.colors.sliderThumb,
        }}
      />
    </View>
  );
};
