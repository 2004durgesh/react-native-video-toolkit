import { Dimensions, Platform } from 'react-native';

/**
 * Which platform the app runs on. The toolkit's one place for these checks.
 */
export const PlatformUtils = {
  isTV: () => Platform.isTV,
  isWeb: () => Platform.OS === 'web',
  isAndroid: () => Platform.OS === 'android',
  isMobile: () => !Platform.isTV && Platform.OS !== 'web',
  isTVOS: () => Platform.OS === 'ios' && Platform.isTV,
  isAndroidTV: () => Platform.OS === 'android' && Platform.isTV,
  isTablet: () => {
    const { width, height } = Dimensions.get('screen');
    const minDimension = Math.min(width, height);
    return minDimension >= 600;
  },
};

/**
 * A Reanimated hook's dependency list, on the web only. Native workletized callbacks track what they
 * use by themselves, and Reanimated warns when a list is passed there.
 * @internal
 */
export const webDependencies = <T extends readonly unknown[]>(dependencies: T): T | undefined =>
  Platform.OS === 'web' ? dependencies : undefined;

/**
 * A Reanimated layout animation (`entering`, `exiting`), off the web only. Reanimated's web
 * layout-animation path throws in some bundler setups ("Cannot convert undefined or null to object"
 * while resolving the DOM node), and these transitions are polish, so the web shows and hides at once.
 * @internal
 */
export const webSafeAnimation = <T>(animation: T): T | undefined => (Platform.OS === 'web' ? undefined : animation);
