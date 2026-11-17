import { hexToRgba } from '../utils';
import type { CaptionsTheme, ResolvedTheme } from '../types';

/**
 * The default subtitle style: white text on a dark box, readable on bright and dark video alike.
 */
export const defaultCaptionsTheme: CaptionsTheme = {
  fontSize: 'auto',
  fontWeight: '500',
  color: '#FFFFFF',
  lineHeightMultiplier: 1.4,
  textAlign: 'center',
  backgroundColor: hexToRgba('#000000', 0.75),
  borderRadius: 4,
  paddingHorizontal: 8,
  paddingVertical: 2,
  outlineWidth: 0,
  outlineColor: '#000000',
  position: 'video',
  bottomMargin: 0.05,
  maxWidth: 0.9,
  maxLines: 3,
};

/**
 * The default theme for the video player.
 */
export const defaultTheme: ResolvedTheme = {
  colors: {
    textMain: '#FAFAFA',
    textSecondary: hexToRgba('#FAFAFA', 0.7),
    iconNormal: '#FAFAFA',
    iconActive: '#5A9EE6',
    sliderTrackActive: '#5A9EE6',
    sliderTrackInactive: '#2A2A2A',
    sliderTrackCache: hexToRgba('#FAFAFA', 0.7),
    sliderThumb: '#5A9EE6',
    menuBackground: '#121212',
    menuBorder: '#3A3A3A',
    menuText: '#FAFAFA',
    menuSeparator: '#3A3A3A',
    buttonPrimaryBackground: '#5A9EE6',
    buttonPrimaryText: '#FAFAFA',
    buttonSecondaryBorder: '#3A3A3A',
    buttonSecondaryText: '#FAFAFA',
    badgeBackground: hexToRgba('#121212', 0.6),
    scrim: hexToRgba('#000000', 0.4),
    ripple: '#3A3A3A',
    tvFocus: hexToRgba('#FFFFFF', 0.25),
    spinner: '#5A9EE6',
    error: '#F25252',
    success: '#60D288',
  },
  iconSizes: {
    sm: 18,
    md: 24,
    lg: 32,
  },
  fontSizes: {
    sm: 13,
    md: 15,
    lg: 18,
  },
  animations: {
    fast: 120,
    normal: 250,
    slow: 600,
  },
  captions: defaultCaptionsTheme,
};
