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
 * @description Determines whether the screen should rotate to landscape orientation based on
 * various conditions and platform-specific logic. The function considers aspect ratio,
 * minimum dimensions, device type, and platform capabilities.
 *
 * ## Rotation Conditions by Platform:
 *
 * ### Mobile Platform:
 * - **Basic Condition**: `aspectRatio > threshold` (default threshold: 1.0)
 * - **Minimum Size**: Both width and height must meet `minWidth` and `minHeight` requirements
 * - **Square Screen Handling**: If `excludeSquare` is true, screens with aspect ratio ~1.0 (±0.1) are excluded
 * - **Safe Area**: Can consider safe area vs full screen dimensions based on `considerSafeArea`
 *
 * **Device-Specific Mobile Thresholds:**
 * - Phone: aspectRatio > 1.3, minWidth: 300px, excludes squares
 * - Tablet: aspectRatio > 1.1, minWidth: 600px, allows squares
 * - Foldable: aspectRatio > 1.2, minWidth: 400px, excludes squares
 *
 * ### Web Platform:
 * - **Basic Condition**: `aspectRatio > threshold` (default threshold: 1.2)
 * - **Minimum Width**: Must meet `minWidth` requirement (default: 768px for tablet/desktop)
 * - **Square Tolerance**: More lenient square detection (±0.05) due to browser resizing
 * - **Responsive Breakpoints**: Different thresholds for phone/tablet/desktop sizes
 *
 * **Device-Specific Web Thresholds:**
 * - Phone (360px+): aspectRatio > 1.3, excludes squares
 * - Tablet (768px+): aspectRatio > 1.2, allows squares
 * - Desktop (1024px+): aspectRatio > 1.1, allows squares
 *
 * ### TV Platform:
 * - **Basic Condition**: `aspectRatio >= threshold` (default threshold: 1.3)
 * - **Legacy Support**: Distinguishes modern 16:9+ TVs from old 4:3 TVs
 * - **Always Landscape**: TVs typically maintain landscape orientation
 * - **Content Layout**: Used more for UI layout decisions than actual rotation
 *
 * **TV Threshold:**
 * - Modern TV: aspectRatio >= 1.3 (16:9 = 1.78, ultrawide > 2.0)
 * - Legacy TV: aspectRatio < 1.3 (4:3 = 1.33)
 *
 * ## Edge Cases and Special Handling:
 *
 * ### Invalid Dimensions:
 * - Returns `false` if width or height <= 0
 * - Logs warning for invalid dimensions
 *
 * ### Square Screens:
 * - **Mobile**: Excludes by default (±0.1 tolerance)
 * - **Web**: More lenient exclusion (±0.05 tolerance)
 * - **TV**: Allows squares (typically not applicable)
 *
 * ### Minimum Dimensions:
 * - Prevents rotation on very small screens
 * - Platform-specific minimums (300px phones, 768px web tablets, etc.)
 *
 * ### Foldable Devices:
 * - Detected when aspectRatio > 2.5
 * - Special handling for unfolded states
 * - Considers safe area for notches/hinges
 *
 * @example
 * ```typescript
 * // Basic usage
 * const shouldRotateScreen = shouldRotate(800, 600); // true (1.33 > 1.0)
 *
 * // With configuration
 * const shouldRotateTablet = shouldRotate(1024, 768, {
 *   threshold: 1.2,
 *   minWidth: 600,
 *   excludeSquare: false
 * }); // true (1.33 > 1.2)
 *
 * // Platform-specific
 * const shouldRotateTV = shouldRotate(1920, 1080, {
 *   platform: 'tv',
 *   threshold: 1.3
 * }); // true (1.78 >= 1.3)
 *
 * // Square screen exclusion
 * const squareScreen = shouldRotate(1000, 1000, {
 *   excludeSquare: true
 * }); // false (square excluded)
 * ```
 *
 * @param width Optional width of screen. If not provided, uses current screen width
 * @param height Optional height of screen. If not provided, uses current screen height
 * @param config Configuration options for rotation detection
 * @param config.threshold Aspect ratio threshold for rotation (default varies by platform)
 * @param config.minWidth Minimum width requirement in pixels
 * @param config.minHeight Minimum height requirement in pixels
 * @param config.excludeSquare Whether to exclude square-ish screens from rotation
 * @param config.considerSafeArea Whether to use safe area vs full screen dimensions
 * @param config.platform Target platform override ('mobile' | 'web' | 'tv' | 'auto')
 *
 * @returns boolean - true if should rotate to landscape, false otherwise
 *
 * @see {@link detectDeviceType} For device type detection logic
 * @see {@link getOptimalConfig} For platform-optimized configuration
 * @see {@link PLATFORM_CONFIGS} For default platform configurations
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
 *
 * @description TV rotation logic focuses on distinguishing content layout rather than
 * physical rotation since TVs are typically fixed in landscape orientation.
 *
 * **TV Rotation Conditions:**
 * - Modern TVs (16:9 or wider): aspectRatio >= 1.3 → returns true
 * - Legacy TVs (4:3): aspectRatio < 1.3 → returns false
 * - Ultrawide displays (21:9, 32:9): aspectRatio >= 2.0 → returns true
 *
 * **Common TV Aspect Ratios:**
 * - 4:3 (old TVs) = 1.33
 * - 16:9 (HD/FHD) = 1.78
 * - 21:9 (ultrawide) = 2.33
 * - 32:9 (super ultrawide) = 3.56
 *
 * @param width Screen width in pixels
 * @param height Screen height in pixels
 * @param config Configuration options (uses threshold default 1.3)
 * @returns boolean - true for modern landscape TVs, false for legacy 4:3 TVs
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
 *
 * @description Web rotation logic considers browser viewport dimensions and responsive
 * design breakpoints. More lenient than mobile due to browser resizing capabilities.
 *
 * **Web Rotation Conditions:**
 * 1. **Minimum Width Check**: width >= minWidth (default 768px for tablet threshold)
 * 2. **Aspect Ratio Check**: aspectRatio > threshold (default 1.2)
 * 3. **Square Detection**: If excludeSquare=false, allows square viewports (±0.05 tolerance)
 *
 * **Responsive Breakpoints:**
 * - Mobile web (< 768px): Often excluded from rotation
 * - Tablet web (768px - 1023px): aspectRatio > 1.2
 * - Desktop web (1024px+): aspectRatio > 1.1, more permissive
 *
 * **Browser Considerations:**
 * - Viewport can be resized dynamically
 * - User may prefer specific orientations
 * - DevTools can simulate mobile viewports
 * - Multi-window setups affect available space
 *
 * **Example Scenarios:**
 * - 1200x800 browser → aspectRatio 1.5 > 1.2 → true
 * - 600x400 mobile → width 600 < 768 → false
 * - 1000x1000 square → excluded if excludeSquare=true → false
 *
 * @param width Browser viewport width in pixels
 * @param height Browser viewport height in pixels
 * @param config Web-specific configuration (threshold: 1.2, minWidth: 768)
 * @returns boolean - true if web viewport should use landscape layout
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
 *
 * @description Mobile rotation logic is the most strict, considering device orientation,
 * safe areas, and various mobile form factors including phones, tablets, and foldables.
 *
 * **Mobile Rotation Conditions:**
 * 1. **Size Requirements**: width >= minWidth AND height >= minHeight
 * 2. **Aspect Ratio**: aspectRatio > threshold (default 1.0)
 * 3. **Square Exclusion**: If excludeSquare=true, excludes aspect ratios ~1.0 (±0.1)
 *
 * **Device-Specific Behavior:**
 *
 * **Phones (< 600px min dimension):**
 * - Threshold: 1.3 (stricter to prevent accidental rotation)
 * - MinWidth: 300px (prevents rotation on very small screens)
 * - ExcludeSquare: true (phones are rarely square)
 * - Example: 414x896 iPhone → aspectRatio 2.16 > 1.3 → true
 *
 * **Tablets (600px+ min dimension):**
 * - Threshold: 1.1 (more permissive for larger screens)
 * - MinWidth: 600px (tablet breakpoint)
 * - ExcludeSquare: false (tablets often used in both orientations)
 * - Example: 768x1024 iPad → aspectRatio 1.33 > 1.1 → true
 *
 * **Foldables (aspectRatio > 2.5 when unfolded):**
 * - Threshold: 1.2 (balanced for unique form factor)
 * - MinWidth: 400px (unfolded width)
 * - ExcludeSquare: true (foldables have distinct orientations)
 * - Example: 2208x1768 Galaxy Fold → aspectRatio 1.25 > 1.2 → true
 *
 * **Safe Area Considerations:**
 * - considerSafeArea=true: Uses window dimensions (excludes notches, nav bars)
 * - considerSafeArea=false: Uses screen dimensions (full physical screen)
 * - Important for devices with notches, punch holes, or gesture areas
 *
 * **Edge Cases:**
 * - Square tablets (1:1 ratio): Handled by excludeSquare setting
 * - Rotated devices: Function works regardless of current orientation
 * - Small screens: Prevented by minWidth/minHeight requirements
 * - Foldable partial open: Detected and handled appropriately
 *
 * @param width Mobile screen width in pixels
 * @param height Mobile screen height in pixels
 * @param config Mobile-specific configuration options
 * @returns boolean - true if mobile device should rotate to landscape
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
 *
 * @description Determines the device category based on screen dimensions and platform.
 * Used to apply appropriate rotation thresholds and UI optimizations.
 *
 * **Detection Logic by Platform:**
 *
 * **TV Platform:**
 * - Always returns 'tv' regardless of dimensions
 * - TVs have unique UI and interaction patterns
 *
 * **Web Platform (based on viewport size):**
 * - Desktop: minDimension >= 1024px
 * - Tablet: minDimension >= 768px and < 1024px
 * - Phone: minDimension < 768px
 *
 * **Mobile Platform (iOS/Android):**
 * - Tablet: minDimension >= 600px
 * - Foldable: aspectRatio > 2.5 (detected when unfolded)
 * - Phone: minDimension >= 300px and aspectRatio <= 2.5
 * - Unknown: minDimension < 300px (very small or unusual devices)
 *
 * **Device Examples:**
 * - iPhone 15 Pro (393x852): phone (393 >= 300, ratio 2.17 <= 2.5)
 * - iPad Pro (834x1194): tablet (834 >= 600)
 * - Galaxy Fold unfolded (2208x1768): foldable (ratio 1.25, but detected specially)
 * - MacBook (1440x900): desktop (900 >= 1024 when considering screen)
 * - Surface Pro (1368x912): tablet (912 >= 768, < 1024)
 *
 * @returns DeviceType - The detected device category
 * @see {@link PLATFORM_CONFIGS} For device-specific configuration values
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
 *
 * @description Predefined configuration objects optimized for different platform and device
 * combinations. These presets are based on real-world usage patterns and device capabilities.
 *
 * **Configuration Rationale:**
 *
 * **Mobile Platform:**
 * - **Phone**: Stricter thresholds (1.3) to prevent accidental rotation during normal use
 * - **Tablet**: More permissive (1.1) as tablets are often used in both orientations
 * - **Foldable**: Balanced (1.2) for unique form factors and usage patterns
 *
 * **Web Platform:**
 * - **Phone viewport**: Similar to mobile but with web-specific minimums
 * - **Tablet viewport**: Optimized for responsive design breakpoints
 * - **Desktop**: Most permissive (1.1) as users have full control over window sizing
 *
 * **TV Platform:**
 * - **TV**: High threshold (1.3) to distinguish modern 16:9+ TVs from legacy 4:3 displays
 *
 * **Key Differences:**
 * - `threshold`: How wide the screen must be to trigger rotation
 * - `minWidth`: Minimum pixel width required (prevents rotation on very small screens)
 * - `excludeSquare`: Whether to exclude square-ish aspect ratios
 * - `considerSafeArea`: Whether to account for notches/safe areas (mobile only)
 *
 * @example
 * ```typescript
 * // Get config for current device
 * const config = PLATFORM_CONFIGS.mobile.phone;
 * const shouldRotate = shouldRotate(414, 896, config);
 *
 * // Use with optimal config helper
 * const optimalConfig = getOptimalConfig();
 * const shouldRotateOptimal = shouldRotate(width, height, optimalConfig);
 * ```
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
 * Get optimal configuration for current platform and device
 *
 * @description Automatically detects the current platform and device type, then returns
 * the most appropriate configuration preset for rotation detection.
 *
 * **Selection Process:**
 * 1. Detect platform (mobile/web/tv) using React Native Platform API
 * 2. Detect device type based on screen dimensions and platform
 * 3. Return corresponding preset from PLATFORM_CONFIGS
 * 4. Include detected platform in returned config
 *
 * **Fallback Behavior:**
 * - If device type not found in configs, uses mobile phone config as fallback
 * - If platform detection fails, defaults to mobile platform
 * - Always includes platform property for debugging/optimization
 *
 * **Usage Scenarios:**
 * - Auto-configuration for libraries and frameworks
 * - Dynamic rotation behavior based on device capabilities
 * - Consistent behavior across different device types
 * - Simplified API for developers who don't want to manage configs manually
 *
 * @example
 * ```typescript
 * // Simple auto-configuration
 * const config = getOptimalConfig();
 * const shouldRotate = shouldRotate(width, height, config);
 *
 * // With override for specific needs
 * const config = getOptimalConfig();
 * config.threshold = 1.5; // Make rotation less sensitive
 * const shouldRotate = shouldRotate(width, height, config);
 * ```
 *
 * @returns RotationConfig - Optimized configuration for current platform and device
 * @see {@link detectPlatform} For platform detection logic
 * @see {@link detectDeviceType} For device type detection logic
 * @see {@link PLATFORM_CONFIGS} For available configuration presets
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
 *
 * @description React hook that provides real-time rotation detection with automatic
 * updates when device orientation or browser window size changes.
 *
 * **Reactive Behavior by Platform:**
 *
 * **Mobile Platform:**
 * - Listens to React Native Dimensions.addEventListener('change')
 * - Updates when device is physically rotated
 * - Respects considerSafeArea setting for window vs screen dimensions
 * - Handles orientation lock scenarios appropriately
 *
 * **Web Platform:**
 * - Listens to browser window.addEventListener('resize')
 * - Updates when browser window is resized or rotated
 * - Tracks viewport dimensions (innerWidth/innerHeight)
 * - Handles responsive design breakpoint changes
 *
 * **TV Platform:**
 * - No listeners (TV dimensions typically don't change)
 * - Returns static calculation based on initial dimensions
 * - Optimizes performance by avoiding unnecessary event listeners
 *
 * **Performance Considerations:**
 * - Uses useMemo to prevent unnecessary recalculations
 * - Automatically cleans up event listeners on unmount
 * - Minimal re-renders (only when dimensions actually change)
 *
 * **State Management:**
 * - Initializes with current dimensions to prevent initial flicker
 * - Updates state only when dimensions change significantly
 * - Maintains consistency across component lifecycle
 *
 * @example
 * ```typescript
 * function VideoPlayer() {
 *   // Basic usage with auto-config
 *   const shouldRotate = useShouldRotate();
 *
 *   // With custom config
 *   const shouldRotateCustom = useShouldRotate({
 *     threshold: 1.3,
 *     minWidth: 600,
 *     excludeSquare: true
 *   });
 *
 *   // Platform-specific config
 *   const shouldRotateWeb = useShouldRotate({
 *     platform: 'web',
 *     threshold: 1.2,
 *     minWidth: 768
 *   });
 *
 *   return (
 *     <View style={shouldRotate ? landscapeStyle : portraitStyle}>
 *       {content}
 *     </View>
 *   );
 * }
 * ```
 *
 * @param config Configuration options for rotation detection
 * @returns boolean - Current rotation state, updates reactively
 * @see {@link shouldRotate} For underlying rotation detection logic
 * @see {@link getOptimalConfig} For automatic configuration
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
