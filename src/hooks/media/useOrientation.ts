import { useCallback, useMemo, useEffect, useState } from 'react';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';
import {
  detectDeviceType,
  getOptimalConfig,
  useShouldRotate,
  PlatformUtils,
  getVideoControlsConfig,
  type RotationConfig,
  type DeviceType,
} from '../../utils/orientation';

export interface OrientationCapabilities {
  canControlOrientation: boolean;
  supportsFullscreen: boolean;
  hasOrientationAPI: boolean;
  isTV: boolean;
  isMobile: boolean;
  isWeb: boolean;
}

export interface OrientationStrategy {
  shouldRotate: boolean;
  orientation: Orientation | null;
  reason: string;
}

export interface UseOrientationResult {
  // Device and platform information
  deviceType: DeviceType;
  platformCapabilities: OrientationCapabilities;

  // Rotation detection
  shouldAutoRotate: boolean;
  isLandscapeOptimal: boolean;

  // Configuration
  rotationConfig: RotationConfig;
  controlsConfig: ReturnType<typeof getVideoControlsConfig>;

  // Orientation state
  orientationLocked: boolean;

  // Actions
  lockToLandscape: () => Promise<boolean>;
  lockToPortrait: () => Promise<boolean>;
  unlockOrientation: () => Promise<boolean>;
  getFullscreenStrategy: () => OrientationStrategy;

  // Fullscreen-specific orientation handlers
  handleEnterFullscreen: () => Promise<void>;
  handleExitFullscreen: () => Promise<void>;
}

/**
 * A comprehensive hook for handling device orientation and rotation logic.
 *
 * @description This hook encapsulates all orientation-related functionality including
 * device detection, platform capabilities, rotation strategies, and orientation control.
 * It provides a clean interface for components that need orientation awareness.
 *
 * **Key Features:**
 * - Auto-detects device type and platform capabilities
 * - Provides intelligent rotation strategies for different scenarios
 * - Handles orientation locking/unlocking with proper error handling
 * - Offers fullscreen-optimized orientation management
 * - Includes reactive rotation detection based on screen dimensions
 * - Supports custom configuration overrides
 *
 * **Device-Specific Behavior:**
 * - **Phones**: Prefer landscape for media consumption
 * - **Tablets**: Conditional rotation based on content and current orientation
 * - **Foldables**: Adaptive behavior for different folded states
 * - **TV**: No rotation (always landscape)
 * - **Web**: User-controlled orientation (no forced rotation)
 *
 * @param customConfig Optional custom rotation configuration
 * @param enableLogging Whether to enable debug logging (default: __DEV__)
 * @returns Comprehensive orientation management interface
 *
 * @example
 * ```typescript
 * const orientation = useOrientation();
 *
 * // Check if device should rotate for current content
 * if (orientation.shouldAutoRotate) {
 *   await orientation.lockToLandscape();
 * }
 *
 * // Get fullscreen strategy
 * const strategy = orientation.getFullscreenStrategy();
 * console.log(`Should rotate: ${strategy.shouldRotate}, Reason: ${strategy.reason}`);
 *
 * // Handle fullscreen with automatic orientation
 * await orientation.handleEnterFullscreen();
 * ```
 */
export const useOrientation = (customConfig?: RotationConfig): UseOrientationResult => {
  // Device and platform detection
  const deviceType = useMemo(() => detectDeviceType(), []);
  const rotationConfig = useMemo(() => customConfig || getOptimalConfig(), [customConfig]);

  // Platform capabilities
  const platformCapabilities = useMemo<OrientationCapabilities>(
    () => ({
      canControlOrientation: !PlatformUtils.isWeb() && !PlatformUtils.isTV(),
      supportsFullscreen: true,
      hasOrientationAPI: !PlatformUtils.isWeb() || (typeof screen !== 'undefined' && 'orientation' in screen),
      isTV: PlatformUtils.isTV(),
      isMobile: PlatformUtils.isMobile(),
      isWeb: PlatformUtils.isWeb(),
    }),
    []
  );

  // Reactive rotation detection
  const shouldAutoRotate = useShouldRotate(rotationConfig);
  const isLandscapeOptimal = shouldAutoRotate;

  // Video controls configuration
  const controlsConfig = useMemo(
    () => getVideoControlsConfig(shouldAutoRotate, rotationConfig.platform),
    [shouldAutoRotate, rotationConfig.platform]
  );

  // Orientation state
  const [orientationLocked, setOrientationLocked] = useState(false);

  // Debug logging
  // useEffect(() => {
  //     console.log('[useOrientation] Initialized:', {
  //       deviceType,
  //       shouldAutoRotate,
  //       platformCapabilities,
  //       rotationConfig,
  //     });
  // }, [deviceType, shouldAutoRotate, platformCapabilities, rotationConfig, enableLogging]);

  /**
   * Safely lock orientation to landscape
   */
  const lockToLandscape = useCallback(async (): Promise<boolean> => {
    if (!platformCapabilities.canControlOrientation) {
      return false;
    }

    try {
      if (RNOrientationDirector.isLockableOrientation(Orientation.landscape)) {
        RNOrientationDirector.lockTo(Orientation.landscape);
        setOrientationLocked(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('[useOrientation] Failed to lock to landscape:', error);
      setOrientationLocked(false);
      return false;
    }
  }, [platformCapabilities.canControlOrientation]);

  /**
   * Safely lock orientation to portrait
   */
  const lockToPortrait = useCallback(async (): Promise<boolean> => {
    if (!platformCapabilities.canControlOrientation) {
      return false;
    }

    try {
      if (RNOrientationDirector.isLockableOrientation(Orientation.portrait)) {
        RNOrientationDirector.lockTo(Orientation.portrait);
        setOrientationLocked(true);
        return true;
      } else {
        console.warn('[useOrientation] Portrait orientation is not lockable');
        return false;
      }
    } catch (error) {
      console.error('[useOrientation] Failed to lock to portrait:', error);
      setOrientationLocked(false);
      return false;
    }
  }, [platformCapabilities.canControlOrientation]);

  /**
   * Safely unlock orientation
   */
  const unlockOrientation = useCallback(async (): Promise<boolean> => {
    if (!platformCapabilities.canControlOrientation || !orientationLocked) {
      return false;
    }

    try {
      // Check if unlock method exists, otherwise fall back to portrait lock
      if (typeof RNOrientationDirector.unlock === 'function') {
        RNOrientationDirector.unlock();
      } else {
        // Fallback: lock to portrait as "unlocked" state
        await lockToPortrait();
      }
      setOrientationLocked(false);
      return true;
    } catch (error) {
      console.error('[useOrientation] Failed to unlock orientation:', error);
      return false;
    }
  }, [platformCapabilities.canControlOrientation, orientationLocked, lockToPortrait]);

  /**
   * Get optimal fullscreen orientation strategy
   */
  const getFullscreenStrategy = useCallback((): OrientationStrategy => {
    // TV: No orientation changes needed
    if (platformCapabilities.isTV) {
      return { shouldRotate: false, orientation: null, reason: 'TV platform' };
    }

    // Web: Let browser/user handle orientation
    if (platformCapabilities.isWeb) {
      return {
        shouldRotate: false,
        orientation: null,
        reason: 'Web platform - user controlled',
      };
    }

    // Mobile: Smart orientation detection
    if (platformCapabilities.canControlOrientation) {
      // Check if current screen dimensions benefit from landscape
      if (shouldAutoRotate) {
        return {
          shouldRotate: true,
          orientation: Orientation.landscape,
          reason: `Device ${deviceType} benefits from landscape (auto-detected)`,
        };
      }

      // Device-specific defaults
      switch (deviceType) {
        case 'phone':
          return {
            shouldRotate: true,
            orientation: Orientation.landscape,
            reason: 'Phone - landscape optimal for video',
          };

        case 'tablet':
          return {
            shouldRotate: shouldAutoRotate,
            orientation: shouldAutoRotate ? Orientation.landscape : null,
            reason: 'Tablet - conditional rotation based on dimensions',
          };

        case 'foldable':
          return {
            shouldRotate: shouldAutoRotate,
            orientation: shouldAutoRotate ? Orientation.landscape : null,
            reason: 'Foldable - adaptive based on current state',
          };

        default:
          return {
            shouldRotate: shouldAutoRotate,
            orientation: shouldAutoRotate ? Orientation.landscape : null,
            reason: 'Unknown device - conservative approach',
          };
      }
    }

    return { shouldRotate: false, orientation: null, reason: 'Orientation control disabled' };
  }, [platformCapabilities, shouldAutoRotate, deviceType]);

  /**
   * Handle orientation when entering fullscreen
   */
  const handleEnterFullscreen = useCallback(async (): Promise<void> => {
    const strategy = getFullscreenStrategy();

    if (strategy.shouldRotate && strategy.orientation) {
      await lockToLandscape();
    } else {
    }
  }, [getFullscreenStrategy, lockToLandscape]);

  /**
   * Handle orientation when exiting fullscreen
   */
  const handleExitFullscreen = useCallback(async (): Promise<void> => {
    if (!orientationLocked || !platformCapabilities.canControlOrientation) {
      return;
    }

    try {
      // Device-specific exit strategy
      if (deviceType === 'phone') {
        // Phones typically return to portrait
        await lockToPortrait();
      } else if (deviceType === 'tablet' || deviceType === 'foldable') {
        // Tablets and foldables: try to unlock or fall back to portrait
        await unlockOrientation();
      } else {
        // Default: restore to portrait
        await lockToPortrait();
      }
    } catch (error) {
      console.error('[useOrientation] Failed to handle fullscreen exit:', error);
    }
  }, [orientationLocked, platformCapabilities.canControlOrientation, deviceType, lockToPortrait, unlockOrientation]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up orientation lock when component unmounts
      if (orientationLocked && platformCapabilities.canControlOrientation) {
        handleExitFullscreen().catch((error) => {
          console.warn('[useOrientation] Cleanup failed:', error);
        });
      }
    };
  }, [orientationLocked, platformCapabilities.canControlOrientation, handleExitFullscreen]);

  return {
    // Device and platform information
    deviceType,
    platformCapabilities,

    // Rotation detection
    shouldAutoRotate,
    isLandscapeOptimal,

    // Configuration
    rotationConfig,
    controlsConfig,

    // Orientation state
    orientationLocked,

    // Actions
    lockToLandscape,
    lockToPortrait,
    unlockOrientation,
    getFullscreenStrategy,

    // Fullscreen-specific handlers
    handleEnterFullscreen,
    handleExitFullscreen,
  };
};

export default useOrientation;
