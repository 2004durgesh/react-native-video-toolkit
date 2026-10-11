import { View } from 'react-native';
import { Host, LoadingIndicator } from '@expo/ui/jetpack-compose';
import { size as sizeModifier } from '@expo/ui/jetpack-compose/modifiers';
import type { SpinnerProps } from 'react-native-video-toolkit';

/**
 * The platform's own buffering spinner through `@expo/ui`: Material 3 Expressive's morphing-shape
 * `LoadingIndicator`, indeterminate (no `progress`).
 */
export function NativeSpinner({ size, color, style }: SpinnerProps) {
  const diameter = size === 'large' ? 56 : 36;

  // `style` centers the spinner over the video; the Compose host sizes itself to the spinner.
  return (
    <View style={style} pointerEvents="none">
      <Host matchContents>
        <LoadingIndicator color={color} modifiers={[sizeModifier(diameter, diameter)]} />
      </Host>
    </View>
  );
}
