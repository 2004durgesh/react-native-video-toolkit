'use client';

// Main VideoPlayer component and compound components
export { VideoPlayer } from './components/VideoPlayer';
// Export the VideoToolkit module with platform-specific resolution

// Platform-specific export
// let NativeVideoToolkit;

// if (Platform.OS === 'web') {
//   // Dynamically import web implementation
//   NativeVideoToolkit = require('./NativeVideoToolkit.web').default;
// } else {
//   // Use native implementation for iOS/Android
//   NativeVideoToolkit = require('./NativeVideoToolkit').default;
// }
// export { NativeVideoToolkit };
export { default as NativeVideoToolkit } from './NativeVideoToolkit';

// Export Layouts components
export { DefaultLayout } from './layouts';

// Core components
export { VideoSurface } from './components/core';

export * from './components';
export * from './gestures';
export * from './hooks';
export * from './layouts';
export * from './providers';
export * from './themes';
export * from './types';
export * from './utils';
