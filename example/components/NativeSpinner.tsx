/**
 * `@expo/ui` has no progress view on web, so the native spinner falls back to the toolkit's default
 * there. iOS and Android use `NativeSpinner.ios.tsx` and `NativeSpinner.android.tsx`.
 */
export { DefaultSpinner as NativeSpinner } from 'react-native-video-toolkit';
