import { Dimensions } from 'react-native';
import { RNOrientationDirector, Orientation } from './director';
import { PlatformUtils } from '../utils/platform';

/** @internal */
export type DeviceType = 'phone' | 'tablet' | 'foldable' | 'tv' | 'unknown';

/**
 * The kind of device, from the screen's size: a shorter side of 600 or more is a tablet, a very
 * long screen (over 2.5:1) a foldable.
 * @internal
 */
export const deviceType = (): DeviceType => {
  if (PlatformUtils.isTV()) return 'tv';
  const { width, height } = Dimensions.get('screen');
  const shorter = Math.min(width, height);
  if (shorter >= 600) return 'tablet';
  if (Math.max(width, height) / shorter > 2.5) return 'foldable';
  return shorter >= 300 ? 'phone' : 'unknown';
};

// The browser and TVs don't turn the screen
const canRotate = () => !PlatformUtils.isWeb() && !PlatformUtils.isTV();

const lockTo = (orientation: Orientation) => {
  if (RNOrientationDirector.isLockableOrientation(orientation)) RNOrientationDirector.lockTo(orientation);
};

/**
 * Turns the screen to landscape for fullscreen.
 * @internal
 */
export const rotateForFullscreen = (): void => {
  if (canRotate()) lockTo(Orientation.landscape);
};

/**
 * Puts the screen back after fullscreen: phones go to portrait, and tablets and foldables rotate
 * freely again. The lock is app-wide, so it doesn't depend on which player locked it.
 * @internal
 */
export const restoreAfterFullscreen = (): void => {
  if (!canRotate()) return;
  const device = deviceType();
  if (device === 'tablet' || device === 'foldable') RNOrientationDirector.unlock();
  else lockTo(Orientation.portrait);
};
