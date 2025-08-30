import React, { useEffect, type FC, type ReactNode } from 'react';
import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useVideo } from '../../providers';
import { Portal } from '@rn-primitives/portal';

export interface BottomSheetProps {
  visible: boolean;
  onClose?: () => void;
  children: ReactNode;
  showHandle?: boolean;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * `BottomSheet` is a customizable, animated bottom sheet component.
 * It provides a modal-like overlay that slides up from the bottom of the screen,
 * and can be dismissed by swiping down or tapping outside.
 * It integrates with the video player's theme and handles fullscreen mode adjustments.
 *
 * @param {object} props - The props for the BottomSheet component.
 * @param {boolean} props.visible - Controls the visibility of the bottom sheet. When `true`, the sheet slides up.
 * @param {() => void} [props.onClose] - Callback function invoked when the bottom sheet is requested to close (e.g., by swiping down or tapping the overlay).
 * @param {ReactNode} props.children - The content to be rendered inside the bottom sheet.
 * @param {boolean} [props.showHandle=true] - Whether to show a drag handle at the top of the sheet for better gesture handling with scrollable content.
 *
 * @returns {JSX.Element | null} The BottomSheet component, or `null` if not visible.
 */
export const BottomSheet: FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  showHandle = true,
}: BottomSheetProps): JSX.Element | null => {
  const { state } = useVideo();
  const { theme, fullscreen } = state;
  const SHEET_HEIGHT = fullscreen ? SCREEN_WIDTH * 0.85 : SCREEN_HEIGHT * 0.45;
  const SHEET_WIDTH = fullscreen ? SCREEN_HEIGHT * 0.75 : SCREEN_WIDTH * 0.9;
  const translateY = useSharedValue(SHEET_HEIGHT);
  const context = useSharedValue({ y: 0 });

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  }, [visible, SHEET_HEIGHT, translateY]);

  // Pan gesture to swipe down
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(event.translationY + context.value.y, 0);
    })
    .onEnd((event) => {
      let shouldClose = false;
      if (event.translationY > SHEET_HEIGHT / 3 || event.velocityY > 600) {
        shouldClose = true;
      }
      if (shouldClose) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200, easing: Easing.out(Easing.ease) });
        if (onClose) runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SHEET_HEIGHT], [1, 0], Extrapolation.CLAMP),
  }));
  if (!visible) return null;

  return (
    <Portal name="sheet-portal">
      <Animated.View style={[styles.container, { backgroundColor: theme.colors.overlay }, backdropAnimatedStyle]}>
        <Pressable style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheetContainer,
            sheetAnimatedStyle,
            {
              backgroundColor: theme.colors.background,
              height: SHEET_HEIGHT,
              width: SHEET_WIDTH,
              borderRadius: 16,
              overflow: 'hidden',
            },
          ]}>
          {showHandle && (
            <GestureDetector gesture={gesture}>
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            </GestureDetector>
          )}
          {!showHandle && <GestureDetector gesture={gesture}>{children}</GestureDetector>}
          {showHandle && children}
        </Animated.View>
      </Animated.View>
    </Portal>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    padding: 16,
  },
  handleContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8, // Adjust to position above padding if needed
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
});
