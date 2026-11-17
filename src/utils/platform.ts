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
