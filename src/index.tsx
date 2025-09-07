// Main VideoPlayer component and compound components
export { VideoPlayer } from './components/VideoPlayer';
// Export the VideoToolkit module with platform-specific resolution
import { Platform } from 'react-native';

// Platform-specific export
let NativeVideoToolkit;

if (Platform.OS === 'web') {
  // Dynamically import web implementation
  NativeVideoToolkit = require('./NativeVideoToolkit.web').default;
} else {
  // Use native implementation for iOS/Android
  NativeVideoToolkit = require('./NativeVideoToolkit').default;
}
export { NativeVideoToolkit };

// Export Layouts components
export { DefaultLayout } from './layouts';

// Core components
export { VideoSurface } from './components/core';

// Basic controls and their types
export * from './components/controls';
export * from './gestures';

// Store and Providers
export { useVideo, VideoProvider, useTheme, ThemeProvider, useSettingsContext, SettingsProvider } from './providers';

// Types
export type * from './types';

//Hooks
export * from './hooks';

//Themes
export * from './themes';
