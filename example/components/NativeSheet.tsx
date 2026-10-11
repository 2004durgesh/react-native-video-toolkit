import { StyleSheet, View } from 'react-native';
import { BottomSheet, RNHostView } from '@expo/ui';
import type { SheetProps } from 'react-native-video-toolkit';

/**
 * Hosts the settings menu in the platform's own sheet through `@expo/ui`
 * (SwiftUI `.sheet` on iOS, Material 3 `ModalBottomSheet` on Android).
 *
 * Material 3's sheet opens in its own window, which doesn't inherit the player's immersive mode.
 * `patches/@expo+ui+57.0.21.patch` makes that window hide the same system bars, so the sheet
 * doesn't bring the navigation bar back over fullscreen video.
 */
export function NativeSheet({ open, onOpenChange, children, style }: SheetProps) {
  const backgroundColor = StyleSheet.flatten(style)?.backgroundColor;

  // React Native content inside a native sheet is measured at its natural width, so percentage
  // widths have nothing to fill. `RNHostView` hands it the sheet's size instead; the snap points
  // give the sheet a height for the content to fill.
  return (
    <BottomSheet
      isPresented={open}
      onDismiss={() => onOpenChange(false)}
      containerColor={backgroundColor}
      contentPadding={0}
      snapPoints={['half', 'full']}>
      <RNHostView>
        <View style={[styles.content, style]}>{children}</View>
      </RNHostView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: '100%',
  },
});
