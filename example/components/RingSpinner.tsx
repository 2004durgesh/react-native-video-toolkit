import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { SpinnerProps } from 'react-native-video-toolkit';

/**
 * A rotating ring drawn with Reanimated, shown while the video buffers.
 */
export function RingSpinner({ size, color, style }: SpinnerProps) {
  const rotation = useSharedValue(0);
  const diameter = size === 'large' ? 44 : 24;

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // `style` centers the spinner with its own transform, so the rotation goes on an inner view.
  return (
    <View style={style} pointerEvents="none">
      <Animated.View
        style={[
          {
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            borderWidth: 4,
            borderColor: color,
            borderTopColor: 'transparent',
          },
          ringStyle,
        ]}
      />
    </View>
  );
}
