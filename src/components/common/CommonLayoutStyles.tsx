import { StyleSheet } from 'react-native';

/**
 * `CommonLayoutStyles` provides a collection of reusable `StyleSheet` definitions
 * for common layout patterns within the video player components.
 * These styles help maintain consistency across different player layouts and controls.
 */
/**
 * Styles that DefaultLayout once shared publicly.
 * @deprecated DefaultLayout keeps its own styles now, and these no longer follow it. Copy what you
 * need; this will be removed in 2.0.
 */
export const CommonLayoutStyles = StyleSheet.create({
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  centerControls: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 9999,
  },
  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  column: { flexDirection: 'column' },
  spacer: { flex: 1 },
});
