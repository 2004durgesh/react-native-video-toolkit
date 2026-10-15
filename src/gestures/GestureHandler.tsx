import { useDoubleTapGesture, useLongPressGesture, usePanGesture, useSingleTapGesture } from '../hooks';
import React, { useMemo, type FC, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, Gesture, type ComposedGesture, type TapGesture } from 'react-native-gesture-handler';
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
  const noGesture = useMemo(() => Gesture.Tap().enabled(false), []);
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
  });
  const { singleTapGesture } = useSingleTapGesture({ onSingleTap });
  const { longPressGesture, isPlaybackRateIncreased } = useLongPressGesture({ onLongPressStart, onLongPressEnd });
  const { verticalPanGesture } = usePanGesture({
    onLeftVerticalPan,
    onRightVerticalPan,
    onGlobalVerticalPan,
    onSwipeUp,
    onSwipeDown,
  });
  // Built once per change of its parts: a new gesture on every render made the detector reconfigure,
  // and double taps and long presses re-render this as they run
  const composedGesture = useMemo<ComposedGesture | TapGesture>(() => {
    if (ended) return noGesture;
    if (enableDoubleTapGestures && enablePanGestures) {
      return Gesture.Exclusive(doubleTapGesture, singleTapGesture, verticalPanGesture, longPressGesture);
    }
    if (enableDoubleTapGestures) return Gesture.Exclusive(doubleTapGesture, singleTapGesture, longPressGesture);
    if (enablePanGestures) return Gesture.Exclusive(verticalPanGesture, singleTapGesture, longPressGesture);
    return singleTapGesture;
  }, [
    ended,
    noGesture,
    enableDoubleTapGestures,
    enablePanGestures,
    doubleTapGesture,
    singleTapGesture,
    verticalPanGesture,
    longPressGesture,
  ]);
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
