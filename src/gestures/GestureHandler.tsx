import { useDoubleTapGesture, useLongPressGesture, usePanGesture, useSingleTapGesture } from '../hooks';
import React, { type FC, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, useExclusiveGestures } from 'react-native-gesture-handler';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useVideoSelector } from '../providers';
import type { GestureHandlerProps } from '../types';
import { PlatformUtils } from '../utils/platform';

// Reanimated's entering and exiting animations have crashed on web, so the 2x badge just appears there
const IS_WEB = PlatformUtils.isWeb();

/**
 * A component that displays the seek time text.
 */
export const SeekText: FC<{ children: ReactNode }> = ({ children }) => {
  return <Text style={styles.seekText}>{children}</Text>;
};

/**
 * A component that displays an overlayed view.
 */
export const OverlayedView = React.forwardRef<
  any,
  {
    children: ReactNode;
    style: StyleProp<ViewStyle>;
  }
>(({ children, style }, ref) => {
  return (
    <Animated.View ref={ref as any} style={[styles.overlayedView, style]}>
      {children}
    </Animated.View>
  );
});

/**
 * A component that handles gestures for the video player.
 *
 * This component is responsible for handling single-tap, double-tap, and pan gestures.
 */
export const GestureHandler: FC<GestureHandlerProps> = ({
  doubleTapSeekInterval = 10,
  onDoubleTapSeekStart,
  onDoubleTapSeekEnd,
  onSingleTap,
  onLongPressStart,
  onLongPressEnd,
  onLeftVerticalPan,
  onRightVerticalPan,
  onGlobalVerticalPan,
  onSwipeUp,
  onSwipeDown,
  children,
}) => {
  const videoRef = useVideoSelector((state) => state.videoRef);
  const enableDoubleTapGestures = useVideoSelector((state) => state.config.enableDoubleTapGestures);
  const enablePanGestures = useVideoSelector((state) => state.config.enablePanGestures);
  // While the source has ended the player's gestures are off: an UpNext card covers the video
  // then, and taps on it would also seek or toggle the controls behind it. Playing again turns
  // them back on.
  const ended = useVideoSelector((state) => state.ended);
  const doubleTapEnabled = !ended && Boolean(enableDoubleTapGestures);
  const panEnabled = !ended && Boolean(enablePanGestures);
  const theme = useVideoSelector((state) => state.theme);
  const {
    doubleTapGesture,
    isDoubleTap,
    doubleTapValue,
    backwardRippleRef,
    forwardRippleRef,
    backwardAnimatedRipple,
    forwardAnimatedRipple,
    forwardAnimatedStyle,
    backwardAnimatedStyle,
  } = useDoubleTapGesture({
    videoRef,
    doubleTapSeekInterval,
    onDoubleTapSeekStart,
    onDoubleTapSeekEnd,
    enabled: doubleTapEnabled,
  });
  const { singleTapGesture } = useSingleTapGesture({ onSingleTap, enabled: !ended });
  // The long press comes with the double tap or the pan, and is off when both are
  const { longPressGesture, isPlaybackRateIncreased } = useLongPressGesture({
    onLongPressStart,
    onLongPressEnd,
    enabled: doubleTapEnabled || panEnabled,
  });
  const { verticalPanGesture } = usePanGesture({
    onLeftVerticalPan,
    onRightVerticalPan,
    onGlobalVerticalPan,
    onSwipeUp,
    onSwipeDown,
    enabled: panEnabled,
  });
  // In order of priority: each gesture waits for the ones before it to fail. Composing is a hook, so
  // all four are always in; the ones turned off with `enabled` take no touches and hold none back.
  const composedGesture = useExclusiveGestures(
    doubleTapGesture,
    singleTapGesture,
    verticalPanGesture,
    longPressGesture
  );
  return (
    <GestureDetector gesture={composedGesture}>
      <View style={StyleSheet.absoluteFill}>
        {isPlaybackRateIncreased && (
          <Animated.View
            entering={IS_WEB ? undefined : FadeInUp.duration(250)}
            exiting={IS_WEB ? undefined : FadeOutDown.duration(200)}
            style={[styles.badgeContainer]}>
            <Text style={[styles.badgeText, { backgroundColor: theme.colors.badgeBackground }]}>2x</Text>
          </Animated.View>
        )}
        <OverlayedView ref={backwardRippleRef} style={styles.backwardSide}>
          <Animated.View style={backwardAnimatedRipple} />
          <Animated.View style={backwardAnimatedStyle}>
            <SeekText>-{doubleTapValue.backward}s</SeekText>
          </Animated.View>
        </OverlayedView>
        <OverlayedView ref={forwardRippleRef} style={styles.forwardSide}>
          <Animated.View style={forwardAnimatedRipple} />
          <Animated.View style={forwardAnimatedStyle}>
            <SeekText>+{doubleTapValue.forward}s</SeekText>
          </Animated.View>
        </OverlayedView>
        {children}
      </View>
    </GestureDetector>
  );
};

export default GestureHandler;

const styles = StyleSheet.create({
  seekText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  // An oval past the player's top, bottom and outer side, so only its curved inner edge shows. It's
  // sized rather than scaled up, so a tap maps straight into it and the ripple grows from the finger.
  overlayedView: {
    position: 'absolute',
    top: '-25%',
    height: '150%',
    width: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 10,
    overflow: 'hidden',
    borderRadius: '50%',
    // backgroundColor: 'red', //for debugging purposes
  },
  backwardSide: {
    left: '-27.5%',
  },
  forwardSide: {
    right: '-27.5%',
  },
  badgeContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    zIndex: 99,
    top: '5%',
  },
  badgeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    textAlign: 'center',
    borderRadius: 6,
  },
});
