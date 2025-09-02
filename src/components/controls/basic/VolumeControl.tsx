import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useVolume } from '../../../hooks';
import { useVideo } from '../../../providers';
import { useSharedValue } from 'react-native-reanimated';
import { Slider } from 'react-native-awesome-slider';

export interface VolumeControlProps {
  orientation?: 'horizontal' | 'vertical';
  width?: number;
  height?: number;
  thumbWidth?: number;
  trackColor?: string;
  progressColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * `VolumeControl` is a slider component that allows users to adjust the video's volume.
 * It provides a visual representation of the current volume level and allows for interactive changes.
 * It uses `react-native-awesome-slider` for the slider functionality and integrates with the video player's volume state.
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
}: VolumeControlProps): React.ReactElement => {
  const { volume, setVolume } = useVolume();
  const {
    state: { theme },
  } = useVideo();

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
  };

  // Shared values for the slider
  const progress = useSharedValue(volume);
  const min = useSharedValue(0);
  const max = useSharedValue(100);
  return (
    <View style={style}>
      <Slider
        progress={progress}
        minimumValue={min}
        maximumValue={max}
        onValueChange={updateVolume}
        theme={{
          minimumTrackTintColor: theme.colors.primary,
          maximumTrackTintColor: theme.colors.secondary,
        }}
        renderBubble={() => null}
        thumbWidth={thumbWidth}
        containerStyle={{
          height,
          width,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
};
