import { Dimensions, Platform } from 'react-native';

export interface RotationConfig {
  threshold?: number;
  minWidth?: number;
  minHeight?: number;
  excludeSquare?: boolean;
  considerSafeArea?: boolean;
  platform?: 'mobile' | 'web' | 'tv' | 'auto';
}

export type DeviceType = 'phone' | 'tablet' | 'foldable' | 'tv' | 'desktop' | 'unknown';

/**
 * Universal screen rotation detection for React Native across all platforms.
 * Supports mobile, web, and TV platforms with platform-specific optimizations.
 *
 * @param width Optional width of screen
 * @param height Optional height of screen
 * @param config Configuration options for rotation detection
 * @returns boolean - true if should rotate to landscape, false otherwise
 */
export function shouldRotate(width?: number, height?: number, config: RotationConfig = {}): boolean {
  const {
    threshold = 1,
    minWidth = 0,
    minHeight = 0,
    excludeSquare = true,
    considerSafeArea = false,
    platform = 'auto',
  } = config;

  const detectedPlatform = platform === 'auto' ? detectPlatform() : platform;

  // Get dimensions based on platform
  const screenData = getDimensions(considerSafeArea, detectedPlatform);
  const { width: screenWidth, height: screenHeight } = screenData;

  const finalWidth = width ?? screenWidth;
  const finalHeight = height ?? screenHeight;

  // Validate dimensions
  if (finalWidth <= 0 || finalHeight <= 0) {
    console.warn('shouldRotate: Invalid dimensions provided');
    return false;
  }

  // Platform-specific logic
  switch (detectedPlatform) {
    case 'tv':
      return handleTVRotation(finalWidth, finalHeight, config);
    case 'web':
      return handleWebRotation(finalWidth, finalHeight, config);
    case 'mobile':
    default:
      return handleMobileRotation(finalWidth, finalHeight, config);
  }
}

/**
 * Detect current platform
 */
function detectPlatform(): 'mobile' | 'web' | 'tv' {
  if (Platform.isTV) {
    return 'tv';
  }

  if (Platform.OS === 'web') {
    return 'web';
  }

  return 'mobile';
}

/**
 * Get dimensions based on platform
 */
function getDimensions(considerSafeArea: boolean, platform: string) {
  if (platform === 'web') {
    // For React Native Web, use window dimensions if available
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth || window.screen.width,
        height: window.innerHeight || window.screen.height,
      };
    }
  }

  // For TV and mobile, use React Native Dimensions
  const dimensionType = considerSafeArea ? 'window' : 'screen';
  return Dimensions.get(dimensionType);
}

/**
 * Handle TV-specific rotation logic
 */
function handleTVRotation(width: number, height: number, config: RotationConfig): boolean {
  const { threshold = 1.3 } = config;

  // TVs are typically always in landscape, but we might want to detect orientation
  // for content layout purposes (16:9 vs ultrawide vs 4:3 old TVs)
  const aspectRatio = width / height;

  // Most modern TVs are 16:9 (1.78) or wider
  // Old 4:3 TVs (1.33) should be considered "portrait-like" for UI layout
  return aspectRatio >= threshold;
}

/**
 * Handle web-specific rotation logic
 */
function handleWebRotation(width: number, height: number, config: RotationConfig): boolean {
  const { threshold = 1.2, minWidth = 768, excludeSquare = false } = config;

  const aspectRatio = width / height;

  // Check minimum width (tablets/desktop threshold)
  if (width < minWidth) {
    return false;
  }

  // Web browsers can be resized, so be more lenient with square detection
  if (excludeSquare && Math.abs(aspectRatio - 1) < 0.05) {
    return false;
  }

  return aspectRatio > threshold;
}

/**
 * Handle mobile-specific rotation logic
 */
function handleMobileRotation(width: number, height: number, config: RotationConfig): boolean {
  const { threshold = 1, minWidth = 0, minHeight = 0, excludeSquare = true } = config;

  const aspectRatio = width / height;

  // Check minimum size requirements
  if (width < minWidth || height < minHeight) {
    return false;
  }

  // Handle square screens (tablets, foldables)
  if (excludeSquare && Math.abs(aspectRatio - 1) < 0.1) {
    return false;
  }

  return aspectRatio > threshold;
}

/**
 * Detect device type across all platforms
 */
export function detectDeviceType(): DeviceType {
  const platform = detectPlatform();
  const { width, height } = getDimensions(false, platform);
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  const aspectRatio = maxDimension / minDimension;

  if (platform === 'tv') {
    return 'tv';
  }

  if (platform === 'web') {
    // Web device detection based on screen size
    if (minDimension >= 1024) {
      return 'desktop';
    } else if (minDimension >= 768) {
      return 'tablet';
    } else {
      return 'phone';
    }
  }

  // Mobile device detection
  if (minDimension >= 600) {
    return 'tablet';
  }

  if (aspectRatio > 2.5) {
    return 'foldable';
  }

  if (minDimension >= 300) {
    return 'phone';
  }

  return 'unknown';
}

/**
 * Platform and device-specific configuration presets
 */
export const PLATFORM_CONFIGS = {
  mobile: {
    phone: {
      threshold: 1.3,
      minWidth: 300,
      excludeSquare: true,
      considerSafeArea: true,
    },
    tablet: {
      threshold: 1.1,
      minWidth: 600,
      excludeSquare: false,
      considerSafeArea: false,
    },
    foldable: {
      threshold: 1.2,
      minWidth: 400,
      excludeSquare: true,
      considerSafeArea: true,
    },
  },
  web: {
    phone: {
      threshold: 1.3,
      minWidth: 360,
      excludeSquare: true,
    },
    tablet: {
      threshold: 1.2,
      minWidth: 768,
      excludeSquare: false,
    },
    desktop: {
      threshold: 1.1,
      minWidth: 1024,
      excludeSquare: false,
    },
  },
  tv: {
    tv: {
      threshold: 1.3, // 4:3 old TVs vs 16:9+ modern
      minWidth: 1280,
      excludeSquare: false,
    },
  },
} as const;

/**
 * Get optimal config for current platform and device
 */
export function getOptimalConfig(): RotationConfig {
  const platform = detectPlatform();
  const deviceType = detectDeviceType();

  const platformConfigs = PLATFORM_CONFIGS[platform];
  const config = platformConfigs[deviceType as keyof typeof platformConfigs];

  return {
    platform,
    // @ts-ignore
    ...config,
  };
}

/**
 * Hook for reactive rotation detection (mobile and web)
 */
export function useShouldRotate(config: RotationConfig = {}) {
  // Import React dynamically to avoid issues on TV platforms that might not have hooks
  const React = require('react');

  const [dimensions, setDimensions] = React.useState(() => {
    const platform = config.platform === 'auto' ? detectPlatform() : config.platform;
    return getDimensions(config.considerSafeArea || false, platform!);
  });

  React.useEffect(() => {
    const platform = config.platform === 'auto' ? detectPlatform() : config.platform;

    if (platform === 'tv') {
      // TV dimensions typically don't change
      return;
    }

    if (platform === 'web' && typeof window !== 'undefined') {
      // Web resize listener
      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    // Mobile orientation change listener
    const subscription = Dimensions.addEventListener('change', ({ screen, window }) => {
      const newDimensions = config.considerSafeArea ? window : screen;
      setDimensions(newDimensions);
    });

    return () => subscription?.remove();
  }, [config.platform, config.considerSafeArea]);

  return React.useMemo(
    () => shouldRotate(dimensions.width, dimensions.height, config),
    [dimensions.width, dimensions.height, config]
  );
}

/**
 * Get platform-specific video controls configuration
 */
export function getVideoControlsConfig(isLandscape: boolean, platform?: string) {
  const detectedPlatform = platform || detectPlatform();

  const baseConfig = {
    isLandscape,
    controlsHeight: isLandscape ? 60 : 80,
    progressBarHeight: isLandscape ? 4 : 6,
    buttonSpacing: isLandscape ? 12 : 16,
    hideControlsDelay: isLandscape ? 3000 : 5000,
  };

  switch (detectedPlatform) {
    case 'tv':
      return {
        ...baseConfig,
        controlsHeight: 80, // Always larger for TV
        buttonSpacing: 24, // Larger for remote navigation
        hideControlsDelay: 5000, // Longer delay for remote usage
        showRemoteHints: true,
        focusable: true,
      };

    case 'web':
      return {
        ...baseConfig,
        showMouseHover: true,
        keyboardNavigable: true,
        showTooltips: true,
      };

    default: // mobile
      return {
        ...baseConfig,
        touchOptimized: true,
        showFullscreenButton: !isLandscape,
      };
  }
}

/**
 * Platform detection utilities
 */
export const PlatformUtils = {
  isTV: () => Platform.isTV,
  isWeb: () => Platform.OS === 'web',
  isMobile: () => !Platform.isTV && Platform.OS !== 'web',

  // TV-specific
  isTVOS: () => Platform.OS === 'ios' && Platform.isTV,
  isAndroidTV: () => Platform.OS === 'android' && Platform.isTV,

  // Web-specific
  isBrowser: () => typeof window !== 'undefined',
  isDesktop: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  },

  // Mobile-specific
  isTablet: () => {
    const { width, height } = Dimensions.get('screen');
    const minDimension = Math.min(width, height);
    return minDimension >= 600;
  },
};
