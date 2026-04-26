import { useDoubleTapGesture, useLongPressGesture, usePanGesture, useSingleTapGesture } from '../hooks';
import React, { type FC, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, Gesture, type ComposedGesture, type TapGesture } from 'react-native-gesture-handler';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useVideo } from '../providers';
import type { GestureHandlerProps } from '../types';

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
  children,
}) => {
  const { state } = useVideo();
  const { fullscreen, videoRef, config, theme } = state;
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
  const { verticalPanGesture } = usePanGesture({ onLeftVerticalPan, onRightVerticalPan, onGlobalVerticalPan });
  let composedGesture: ComposedGesture | TapGesture;
  if (config.enableDoubleTapGestures && config.enablePanGestures) {
    composedGesture = Gesture.Exclusive(doubleTapGesture, singleTapGesture, verticalPanGesture, longPressGesture);
  } else if (config.enableDoubleTapGestures) {
    composedGesture = Gesture.Exclusive(doubleTapGesture, singleTapGesture, longPressGesture);
  } else if (config.enablePanGestures) {
    composedGesture = Gesture.Exclusive(verticalPanGesture, singleTapGesture, longPressGesture);
  } else {
    composedGesture = singleTapGesture;
  }
  const FULLSCREEN_HEIGHT = fullscreen ? '50%' : '100%';
  return (
    <GestureDetector gesture={composedGesture}>
      <View style={StyleSheet.absoluteFill}>
        {isPlaybackRateIncreased && (
          <Animated.View
            entering={FadeInUp.duration(250)}
            exiting={FadeOutDown.duration(200)}
            style={[styles.badgeContainer]}>
            <Text style={[styles.badgeText, { backgroundColor: theme.colors.badgeBackground }]}>2x</Text>
          </Animated.View>
        )}
        <OverlayedView ref={backwardRippleRef} style={{ left: '-15%', height: FULLSCREEN_HEIGHT }}>
          <Animated.View style={backwardAnimatedRipple} />
          <Animated.View style={backwardAnimatedStyle}>
            <SeekText>-{doubleTapValue.backward}s</SeekText>
          </Animated.View>
        </OverlayedView>
        <OverlayedView ref={forwardRippleRef} style={{ right: '-15%', height: FULLSCREEN_HEIGHT }}>
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
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  overlayedView: {
    position: 'absolute',
    top: 0,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 10,
    overflow: 'hidden',
    borderRadius: '50%',
    transform: [{ scale: 1.5 }],
    // backgroundColor: 'red', //for debugging purposes
  },
  badgeContainer: {
    ...StyleSheet.absoluteFillObject,
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
