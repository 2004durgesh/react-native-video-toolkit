import { useCallback, useMemo, useState } from 'react';
import { RNOrientationDirector, Orientation } from '../../fullscreen/director';
import {
  detectDeviceType,
  getOptimalConfig,
  useShouldRotate,
  PlatformUtils,
  getVideoControlsConfig,
  type RotationConfig,
  type DeviceType,
} from '../../utils';

/**
 * What this platform can do with the screen orientation.
 * @deprecated Will be removed in 2.0.
 */
export interface OrientationCapabilities {
  canControlOrientation: boolean;
  /** Always `true`. */
  supportsFullscreen: boolean;
  hasOrientationAPI: boolean;
  isTV: boolean;
  isMobile: boolean;
}

/**
 * Whether to turn the screen for fullscreen, and why.
 * @deprecated Will be removed in 2.0.
 */
export interface OrientationStrategy {
  shouldRotate: boolean;
  orientation: Orientation | null;
  reason: string;
}

/**
 * Return type for the useOrientation hook.
 * @deprecated Will be removed in 2.0.
 */
export interface UseOrientationResult {
  deviceType: DeviceType;
  platformCapabilities: OrientationCapabilities;
  shouldAutoRotate: boolean;
  /** The same as `shouldAutoRotate`. */
  isLandscapeOptimal: boolean;
  rotationConfig: RotationConfig;
  controlsConfig: ReturnType<typeof getVideoControlsConfig>;
  /** Whether this hook locked the orientation. Another caller's lock isn't reflected. */
  orientationLocked: boolean;
  lockToLandscape: () => Promise<boolean>;
  lockToPortrait: () => Promise<boolean>;
  unlockOrientation: () => Promise<boolean>;
  getFullscreenStrategy: () => OrientationStrategy;
  handleEnterFullscreen: () => Promise<void>;
  handleExitFullscreen: () => Promise<void>;
}

/**
 * Device detection and screen orientation locking, as fullscreen used to do it.
 *
 * @deprecated Fullscreen handles the orientation itself (`useFullscreen`, `config.enableScreenRotation`).
 * To lock the orientation yourself, use react-native-orientation-director directly. Will be removed in 2.0.
 * @param customConfig - Options for the rotation check; the device's defaults when left out.
 * @returns The device's details and orientation controls.
 */
export const useOrientation = (customConfig?: RotationConfig): UseOrientationResult => {
  const deviceType = useMemo(() => detectDeviceType(), []);
  const rotationConfig = useMemo(() => customConfig || getOptimalConfig(), [customConfig]);
  const platformCapabilities = useMemo<OrientationCapabilities>(
    () => ({
      canControlOrientation: !PlatformUtils.isWeb() && !PlatformUtils.isTV(),
      supportsFullscreen: true,
      hasOrientationAPI: !PlatformUtils.isWeb() || 'orientation' in ((globalThis as { screen?: object }).screen ?? {}),
      isTV: PlatformUtils.isTV(),
      isMobile: PlatformUtils.isMobile(),
    }),
    []
  );
  const shouldAutoRotate = useShouldRotate(rotationConfig);
  const controlsConfig = useMemo(
    () => getVideoControlsConfig(shouldAutoRotate, rotationConfig.platform),
    [shouldAutoRotate, rotationConfig.platform]
  );
  const [orientationLocked, setOrientationLocked] = useState(false);
  const { canControlOrientation } = platformCapabilities;

  const lockTo = useCallback(
    async (orientation: Orientation): Promise<boolean> => {
      if (!canControlOrientation || !RNOrientationDirector.isLockableOrientation(orientation)) return false;
      RNOrientationDirector.lockTo(orientation);
      setOrientationLocked(true);
      return true;
    },
    [canControlOrientation]
  );
  const lockToLandscape = useCallback(() => lockTo(Orientation.landscape), [lockTo]);
  const lockToPortrait = useCallback(() => lockTo(Orientation.portrait), [lockTo]);
  const unlockOrientation = useCallback(async (): Promise<boolean> => {
    if (!canControlOrientation) return false;
    RNOrientationDirector.unlock();
    setOrientationLocked(false);
    return true;
  }, [canControlOrientation]);

  const getFullscreenStrategy = useCallback((): OrientationStrategy => {
    if (platformCapabilities.isTV) return { shouldRotate: false, orientation: null, reason: 'TV platform' };
    if (!canControlOrientation)
      return { shouldRotate: false, orientation: null, reason: 'Orientation control disabled' };
    if (shouldAutoRotate || deviceType === 'phone') {
      return { shouldRotate: true, orientation: Orientation.landscape, reason: `Landscape suits a ${deviceType}` };
    }
    return { shouldRotate: false, orientation: null, reason: `A ${deviceType} keeps its orientation` };
  }, [platformCapabilities.isTV, canControlOrientation, shouldAutoRotate, deviceType]);

  const handleEnterFullscreen = useCallback(async () => {
    if (getFullscreenStrategy().shouldRotate) await lockToLandscape();
  }, [getFullscreenStrategy, lockToLandscape]);

  const handleExitFullscreen = useCallback(async () => {
    if (!canControlOrientation) return;
    if (deviceType === 'tablet' || deviceType === 'foldable') await unlockOrientation();
    else await lockToPortrait();
  }, [canControlOrientation, deviceType, lockToPortrait, unlockOrientation]);

  return {
    deviceType,
    platformCapabilities,
    shouldAutoRotate,
    isLandscapeOptimal: shouldAutoRotate,
    rotationConfig,
    controlsConfig,
    orientationLocked,
    lockToLandscape,
    lockToPortrait,
    unlockOrientation,
    getFullscreenStrategy,
    handleEnterFullscreen,
    handleExitFullscreen,
  };
};
