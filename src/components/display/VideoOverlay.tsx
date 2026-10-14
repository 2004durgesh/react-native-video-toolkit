import type { ReactNode } from 'react';
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useVideoSelector } from '../../providers';
import { PlatformUtils } from '../../utils/orientation';

/**
 * Props for the VideoOverlay component.
 */
export interface VideoOverlayProps {
  /**
   * Whether to show the overlay. It fades in and out, and takes no taps while hidden.
   * @default true
   */
  visible?: boolean;
  /**
   * Show it only while the player's controls are visible, fading with them.
   * @default false
   */
  withControls?: boolean;
  /**
   * Tints the video behind the content: `true` uses the theme's `scrim` color, or pass a color.
   * @default false
   */
  scrim?: boolean | ColorValue;
  /**
   * Which taps the overlay takes. `'box-none'` takes only taps on its own buttons and passes the rest
   * to the player, so a tap still toggles the controls. `'auto'` takes every tap, for a card that
   * covers the video. `'none'` takes none.
   * @default 'box-none'
   */
  pointerEvents?: 'box-none' | 'auto' | 'none';
  /**
   * Styles for the full-size layer, for example to center or position the content.
   */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const DEFAULT_SCRIM = 'rgba(0, 0, 0, 0.4)';

/** The overlay's style and whether it's shown, shared by the native and web versions. */
const useOverlay = ({
  visible = true,
  withControls = false,
  scrim = false,
  pointerEvents = 'box-none',
  style,
}: VideoOverlayProps) => {
  // Constant `false` without `withControls`, so the overlay doesn't re-render on every tap
  const controlsVisible = useVideoSelector((state) => withControls && state.controlsVisible);
  const themeScrim = useVideoSelector((state) => state.theme.colors.scrim);
  const shown = visible && (!withControls || controlsVisible);
  const backgroundColor = scrim === true ? (themeScrim ?? DEFAULT_SCRIM) : scrim || undefined;

  return {
    shown,
    layerStyle: [styles.fill, backgroundColor ? { backgroundColor } : null, style],
    touchStyle: shown ? touchStyles[pointerEvents] : touchStyles.none,
  };
};

const NativeVideoOverlay = (props: VideoOverlayProps): React.ReactElement => {
  const { shown, layerStyle, touchStyle } = useOverlay(props);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: withTiming(shown ? 1 : 0, { duration: 150 }) }), [shown]);

  return <Animated.View style={[layerStyle, fadeStyle, touchStyle]}>{props.children}</Animated.View>;
};

// On web, Reanimated drops `pointerEvents: 'box-none'` from animated views, so a full-size one
// would take every click, and its style updates have crashed there. Web shows and hides at once.
const WebVideoOverlay = (props: VideoOverlayProps): React.ReactElement => {
  const { shown, layerStyle, touchStyle } = useOverlay(props);

  return <View style={[layerStyle, touchStyle, !shown && styles.hidden]}>{props.children}</View>;
};

/**
 * A full-size layer over the video for your own content: a card, a watermark, a gradient, or a
 * tint. Render it inside `VideoPlayer`, after the layout, so it sits above the video and the
 * controls. `UpNext` is built on it.
 *
 * @param {VideoOverlayProps} props - The props for the component.
 * @returns {React.ReactElement} The overlay.
 */
export const VideoOverlay = PlatformUtils.isWeb() ? WebVideoOverlay : NativeVideoOverlay;

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
  },
  hidden: {
    opacity: 0,
  },
});

const touchStyles = StyleSheet.create({
  'box-none': { pointerEvents: 'box-none' },
  'auto': { pointerEvents: 'auto' },
  'none': { pointerEvents: 'none' },
});
