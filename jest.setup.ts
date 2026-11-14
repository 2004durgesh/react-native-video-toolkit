/* eslint-env jest */
// Mocks for the native parts the toolkit's components touch, so they render under Jest.

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('./src/NativeVideoToolkit', () => {
  const module = {
    enterFullscreen: jest.fn(async () => true),
    exitFullscreen: jest.fn(async () => true),
    isFullscreen: jest.fn(async () => false),
    isPictureInPictureSupported: jest.fn(() => false),
  };
  return { __esModule: true, NativeVideoToolkit: module, default: module };
});

jest.mock('react-native-orientation-director', () => ({
  __esModule: true,
  default: {
    lockTo: jest.fn(),
    unlock: jest.fn(),
    getInterfaceOrientation: jest.fn(async () => 1),
    getDeviceOrientation: jest.fn(async () => 1),
    listenForInterfaceOrientationChanges: jest.fn(() => ({ remove: jest.fn() })),
    listenForDeviceOrientationChanges: jest.fn(() => ({ remove: jest.fn() })),
    isLocked: jest.fn(() => false),
  },
  Orientation: { unknown: 0, portrait: 1, portraitUpsideDown: 2, landscapeLeft: 3, landscapeRight: 4, landscape: 5 },
}));
