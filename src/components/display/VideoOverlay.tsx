import type { ReactNode } from 'react';
import { StyleSheet, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { useVideoSelector } from '../../providers';
import { Fade } from '../common/fade';

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
  /**
   * Identifies the overlay in end-to-end tests.
   */
  testID?: string;
  children?: ReactNode;
}

/**
 * A full-size layer over the video for your own content: a card, a watermark, a gradient, or a
 * tint. Render it inside `VideoPlayer`, after the layout, so it sits above the video and the
 * controls. `UpNext` is built on it.
 *
 * @param {VideoOverlayProps} props - The props for the component.
 * @returns {React.ReactElement} The overlay.
 */
export const VideoOverlay = ({
  visible = true,
  withControls = false,
  scrim = false,
  pointerEvents = 'box-none',
  style,
  testID,
  children,
}: VideoOverlayProps): React.ReactElement => {
  // Constant `false` without `withControls`, so the overlay doesn't re-render on every tap
  const controlsVisible = useVideoSelector((state) => withControls && state.controlsVisible);
  const themeScrim = useVideoSelector((state) => state.theme.colors.scrim);
  const shown = visible && (!withControls || controlsVisible);
  const backgroundColor = scrim === true ? themeScrim : scrim || undefined;

  return (
    <Fade
      shown={shown}
      touches={pointerEvents}
      style={[styles.fill, backgroundColor ? { backgroundColor } : null, style]}
      testID={testID}>
      {children}
    </Fade>
  );
};

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
  },
});
