import { Pressable, StyleSheet } from 'react-native';
import type { PressFeedbackProps } from 'react-native-video-toolkit';

/**
 * Shrinks the button and tints it while pressed, instead of the default ripple.
 * It has no `onPress`: the toolkit detects the tap itself, `Pressable` is only used for its
 * `pressed` state.
 */
export function ScalePressFeedback({ children, color, style, ...viewProps }: PressFeedbackProps) {
  return (
    <Pressable
      {...viewProps}
      style={({ pressed }) => [styles.base, style, pressed && [styles.pressed, { backgroundColor: color }]]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 50,
  },
  pressed: {
    transform: [{ scale: 0.88 }],
  },
});
