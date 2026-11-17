import { Dimensions } from 'react-native';
import { RNOrientationDirector, Orientation } from './director';
import { PlatformUtils } from '../utils/platform';

/** @internal */
export type DeviceType = 'phone' | 'tablet' | 'foldable' | 'tv' | 'unknown';

/** @internal */
export const deviceType = (): DeviceType => {
  if (PlatformUtils.isTV()) return 'tv';
  if (PlatformUtils.isTablet()) return 'tablet';
  const { width, height } = Dimensions.get('screen');
  const shorter = Math.min(width, height);
  if (Math.max(width, height) / shorter > 2.5) return 'foldable';
  return shorter >= 300 ? 'phone' : 'unknown';
};

// The browser and TVs don't turn the screen
const canRotate = () => !PlatformUtils.isWeb() && !PlatformUtils.isTV();

const lockTo = (orientation: Orientation) => {
  if (RNOrientationDirector.isLockableOrientation(orientation)) RNOrientationDirector.lockTo(orientation);
};

/** @internal */
export const rotateForFullscreen = (): void => {
  if (canRotate()) lockTo(Orientation.landscape);
};

/**
 * The lock is app-wide, so restoring it doesn't depend on which player locked it.
 * @internal
 */
export const restoreAfterFullscreen = (): void => {
  if (!canRotate()) return;
  const device = deviceType();
  if (device === 'tablet' || device === 'foldable') RNOrientationDirector.unlock();
  else lockTo(Orientation.portrait);
};
