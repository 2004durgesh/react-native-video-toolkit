import { Dimensions, Platform } from 'react-native';

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

  // Mobile-specific
  isTablet: () => {
    const { width, height } = Dimensions.get('screen');
    const minDimension = Math.min(width, height);
    return minDimension >= 600;
  },
};
