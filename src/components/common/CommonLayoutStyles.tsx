import { StyleSheet } from 'react-native';

/**
 * `CommonLayoutStyles` provides a collection of reusable `StyleSheet` definitions
 * for common layout patterns within the video player components.
 * These styles help maintain consistency across different player layouts and controls.
 */
export const CommonLayoutStyles = StyleSheet.create({
  topControls: { flex: 1, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' },
  centerControls: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomControls: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  column: { flexDirection: 'column' },
  spacer: { flex: 1 },
});
