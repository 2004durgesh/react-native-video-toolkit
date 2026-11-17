import { useMemo } from 'react';
import { Dimensions, Platform, useWindowDimensions } from 'react-native';
import { deviceType, type DeviceType as Device } from '../fullscreen/orientation';

/**
 * Options for {@link shouldRotate}.
 * @deprecated The toolkit no longer uses these orientation helpers. Will be removed in 2.0.
 */
export interface RotationConfig {
  /** The aspect ratio above which landscape is better. */
  threshold?: number;
  minWidth?: number;
  minHeight?: number;
  /** Treat nearly square screens (within 10%) as not benefiting from landscape. */
  excludeSquare?: boolean;
  /** Measure the window instead of the screen. */
  considerSafeArea?: boolean;
  platform?: 'mobile' | 'tv' | 'auto';
}

/**
 * The kind of device.
 * @deprecated Will be removed in 2.0.
 */
export type DeviceType = Device;

const platformOf = (platform: RotationConfig['platform'] = 'auto'): 'mobile' | 'tv' =>
  platform === 'auto' ? (Platform.isTV ? 'tv' : 'mobile') : platform;

const sizeOf = (considerSafeArea = false) => Dimensions.get(considerSafeArea ? 'window' : 'screen');

/**
 * Whether a screen of this size benefits from landscape. TVs compare the aspect ratio with
 * `threshold` (1.3); phones and tablets also check the minimum size and skip nearly square screens.
 * The screen's size is used for a missing width or height.
 *
 * @deprecated The toolkit no longer uses it. Will be removed in 2.0.
 */
export function shouldRotate(width?: number, height?: number, config: RotationConfig = {}): boolean {
  const screen = sizeOf(config.considerSafeArea);
  const w = width ?? screen.width;
  const h = height ?? screen.height;
  if (w <= 0 || h <= 0) return false;
  const aspectRatio = w / h;
  if (platformOf(config.platform) === 'tv') return aspectRatio >= (config.threshold ?? 1.3);
  const { threshold = 1, minWidth = 0, minHeight = 0, excludeSquare = true } = config;
  if (w < minWidth || h < minHeight) return false;
  if (excludeSquare && Math.abs(aspectRatio - 1) < 0.1) return false;
  return aspectRatio > threshold;
}

/**
 * The kind of device, from the screen's size.
 *
 * @deprecated Will be removed in 2.0.
 */
export function detectDeviceType(): DeviceType {
  return deviceType();
}

/**
 * {@link shouldRotate} options for each kind of device.
 * @deprecated Will be removed in 2.0.
 */
export const PLATFORM_CONFIGS = {
  mobile: {
    phone: { threshold: 1.3, minWidth: 300, excludeSquare: true, considerSafeArea: true },
    tablet: { threshold: 1.1, minWidth: 600, excludeSquare: false, considerSafeArea: false },
    foldable: { threshold: 1.2, minWidth: 400, excludeSquare: true, considerSafeArea: true },
  },
  tv: {
    tv: { threshold: 1.3, minWidth: 1280, excludeSquare: false },
  },
} as const;

/**
 * The {@link shouldRotate} options for this device. An unknown device gets only `platform`.
 *
 * @deprecated Will be removed in 2.0.
 */
export function getOptimalConfig(): RotationConfig {
  const platform = platformOf();
  const configs: Record<string, RotationConfig> = PLATFORM_CONFIGS[platform];
  return { platform, ...configs[deviceType()] };
}

/**
 * {@link shouldRotate} for the current screen, updated as the window changes.
 *
 * @deprecated Will be removed in 2.0.
 */
export function useShouldRotate(config: RotationConfig = {}): boolean {
  const window = useWindowDimensions();
  const size = config.considerSafeArea ? window : sizeOf(false);
  return useMemo(() => shouldRotate(size.width, size.height, config), [size.width, size.height, config]);
}

/**
 * Suggested control sizes for an orientation and platform.
 *
 * @deprecated The toolkit's controls never used it. Will be removed in 2.0.
 */
export function getVideoControlsConfig(isLandscape: boolean, platform?: string) {
  const base = {
    isLandscape,
    controlsHeight: isLandscape ? 60 : 80,
    progressBarHeight: isLandscape ? 4 : 6,
    buttonSpacing: isLandscape ? 12 : 16,
    hideControlsDelay: isLandscape ? 3000 : 5000,
  };
  if ((platform || platformOf()) === 'tv') {
    return {
      ...base,
      controlsHeight: 80,
      buttonSpacing: 24,
      hideControlsDelay: 5000,
      showRemoteHints: true,
      focusable: true,
    };
  }
  return { ...base, touchOptimized: true, showFullscreenButton: !isLandscape };
}
