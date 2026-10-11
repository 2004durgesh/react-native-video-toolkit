import { View } from 'react-native';
import { Host, ProgressView } from '@expo/ui/swift-ui';
import { controlSize, tint } from '@expo/ui/swift-ui/modifiers';
import type { SpinnerProps } from 'react-native-video-toolkit';

/**
 * The platform's own buffering spinner through `@expo/ui`: SwiftUI's indeterminate `ProgressView`.
 */
export function NativeSpinner({ size, color, style }: SpinnerProps) {
  // `style` centers the spinner over the video; the SwiftUI host sizes itself to the spinner.
  return (
    <View style={style} pointerEvents="none">
      <Host matchContents>
        <ProgressView modifiers={[controlSize(size === 'large' ? 'large' : 'regular'), tint(color)]} />
      </Host>
    </View>
  );
}
