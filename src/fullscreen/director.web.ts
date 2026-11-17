// The web build's stand-in for react-native-orientation-director, which needs the native module.
// The toolkit never rotates the screen on the web, so nothing here is called in practice.

export enum Orientation {
  unknown = 0,
  portrait = 1,
  portraitUpsideDown = 2,
  landscapeLeft = 3,
  landscapeRight = 4,
  landscape = 5,
}

export const RNOrientationDirector = {
  isLockableOrientation: (_orientation: Orientation): boolean => false,
  lockTo: (_orientation: Orientation): void => {},
  unlock: (): void => {},
};
