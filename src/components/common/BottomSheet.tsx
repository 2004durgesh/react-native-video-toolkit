import React, { useEffect, useMemo, type FC, type ReactNode } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
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
import { useVideo, Portal } from '../../providers';
import { detectDeviceType, PlatformUtils } from '../../utils/orientation';

export interface BottomSheetProps {
  visible: boolean;
  onClose?: () => void;
  children: ReactNode;
  showHandle?: boolean;
}

/**
 * `BottomSheet` is a responsive, cross-platform animated bottom sheet component.
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

  /**
   * Calculate responsive dimensions for the bottom sheet based on device type and orientation
   * Handles both videoLayout dimensions and window dimensions (for web/fallback cases)
   */
  const sheetDimensions = useMemo(() => {
    const deviceType = detectDeviceType();
    const isTV = PlatformUtils.isTV();
    const isTablet = PlatformUtils.isTablet();
    const isWeb = PlatformUtils.isWeb();

    let sheetHeight: number;
    let sheetWidth: number;
    const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = state.videoWrapperLayout;

    // When using window dimensions (web or fallback) - use standard multipliers
    if (isTV || isWeb) {
      sheetHeight = fullscreen ? SCREEN_HEIGHT * 0.75 : SCREEN_HEIGHT * 0.65;
      sheetWidth = fullscreen ? SCREEN_WIDTH * 0.65 : SCREEN_WIDTH * 0.55;
    } else if (isTablet) {
      sheetHeight = fullscreen ? SCREEN_HEIGHT * 0.85 : SCREEN_HEIGHT * 0.65;
      sheetWidth = fullscreen ? SCREEN_WIDTH * 0.75 : SCREEN_WIDTH * 0.85;
    } else if (deviceType === 'foldable') {
      sheetHeight = fullscreen ? SCREEN_HEIGHT * 0.8 : SCREEN_HEIGHT * 0.6;
      sheetWidth = fullscreen ? SCREEN_WIDTH * 0.85 : SCREEN_WIDTH * 0.95;
    } else {
      // Phone/web with window dimensions
      sheetHeight = fullscreen ? SCREEN_HEIGHT * 0.9 : SCREEN_HEIGHT * 1.5;
      sheetWidth = fullscreen ? SCREEN_WIDTH * 0.8 : SCREEN_WIDTH * 0.95;
    }

    return {
      height: Math.max(sheetHeight, 200),
      width: Math.max(sheetWidth, 300),
    };
  }, [fullscreen, state.videoWrapperLayout]);

  const SHEET_HEIGHT = sheetDimensions.height;
  const SHEET_WIDTH = sheetDimensions.width;

  const translateY = useSharedValue(SHEET_HEIGHT);
  const context = useSharedValue({ y: 0 });

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  }, [visible, SHEET_HEIGHT, translateY]);

  const gestureConfig = useMemo(() => {
    const isTV = PlatformUtils.isTV();
    const isTablet = PlatformUtils.isTablet();

    return {
      closeThreshold: isTV ? SHEET_HEIGHT / 2 : SHEET_HEIGHT / 3,
      velocityThreshold: isTV ? 300 : isTablet ? 500 : 600,
      gestureEnabled: !isTV,
    };
  }, [SHEET_HEIGHT]);

  const gesture = Gesture.Pan()
    .enabled(gestureConfig.gestureEnabled)
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(event.translationY + context.value.y, 0);
    })
    .onEnd((event) => {
      let shouldClose = false;
      if (event.translationY > gestureConfig.closeThreshold || event.velocityY > gestureConfig.velocityThreshold) {
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
  const platformStyles = useMemo(() => {
    const isTV = PlatformUtils.isTV();
    const isTablet = PlatformUtils.isTablet();

    return {
      borderRadius: isTV ? 12 : 16, // Slightly less rounded for TV
      padding: isTV ? 24 : isTablet ? 20 : 16, // More padding for TV/tablet
      marginBottom: isTV ? 16 : 18, // More bottom margin for TV
      handleHeight: isTV ? 6 : 4, // Thicker handle for TV visibility
      handleWidth: isTV ? 60 : 40, // Wider handle for TV
    };
  }, []);

  if (!visible) return null;

  return (
    <Portal name="sheet-portal">
      <Animated.View style={[styles.container, { backgroundColor: theme.colors.overlay }, backdropAnimatedStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheetContainer,
            sheetAnimatedStyle,
            {
              backgroundColor: theme.colors.background,
              maxHeight: SHEET_HEIGHT,
              width: SHEET_WIDTH,
              borderRadius: platformStyles.borderRadius,
              padding: platformStyles.padding,
              marginBottom: platformStyles.marginBottom,
            },
          ]}>
          {showHandle && (
            <GestureDetector gesture={gesture}>
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    {
                      height: platformStyles.handleHeight,
                      width: platformStyles.handleWidth,
                    },
                  ]}
                />
              </View>
            </GestureDetector>
          )}

          {/* Content Logic: 
              If handle is hidden, dragging the content closes the sheet.
              If handle is shown, content is NOT draggable (allows scrolling inside).
          */}
          {!showHandle && gestureConfig.gestureEnabled ? (
            <GestureDetector gesture={gesture}>
              {/* Use a wrapper view to accept the gesture */}
              <View style={{ flex: 1 }}>{children}</View>
            </GestureDetector>
          ) : (
            children
          )}
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
    overflow: 'hidden',
  },
  handleContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  handle: {
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
});
