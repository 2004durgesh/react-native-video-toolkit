/* eslint-env jest */
// Mocks for the native parts the toolkit's components touch, so they render under Jest.

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// The video player, as a plain view whose props tests read (`native-video`), with a `seek` spy on
// its ref. The rest of react-native-video (track type constants) is the real thing.
jest.mock('react-native-video', () => {
  const actual = jest.requireActual('react-native-video');
  const ReactActual = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const MockVideo = ReactActual.forwardRef((props: object, ref: unknown) => {
    // Attached once, like the real player's handle: re-attaching it shows the controls
    const [handle] = ReactActual.useState(() => ({ seek: jest.fn() }));
    ReactActual.useImperativeHandle(ref, () => handle, [handle]);
    return ReactActual.createElement(View, { ...props, testID: 'native-video' });
  });
  return { __esModule: true, ...actual, default: MockVideo };
});

jest.mock('./src/NativeVideoToolkit', () => {
  const module = {
    enterFullscreen: jest.fn(async () => true),
    exitFullscreen: jest.fn(async () => true),
    isFullscreen: jest.fn(async () => false),
    isPictureInPictureSupported: jest.fn(() => false),
  };
  return { __esModule: true, NativeVideoToolkit: module, default: module };
});

// Only what the toolkit calls
jest.mock('react-native-orientation-director', () => ({
  __esModule: true,
  default: {
    lockTo: jest.fn(),
    unlock: jest.fn(),
    isLockableOrientation: jest.fn(() => true),
  },
  Orientation: { portrait: 1, landscape: 5 },
}));
