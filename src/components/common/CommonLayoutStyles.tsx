import { StyleSheet } from 'react-native';

/**
 * `CommonLayoutStyles` provides a collection of reusable `StyleSheet` definitions
 * for common layout patterns within the video player components.
 * These styles help maintain consistency across different player layouts and controls.
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
    ...StyleSheet.absoluteFillObject,
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
