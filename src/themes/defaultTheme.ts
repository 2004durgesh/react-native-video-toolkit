import { hexToRgba } from '../utils';
import type { Theme } from '../types';

/**
 * The default theme for the video player.
 */
export const defaultTheme: Theme = {
  colors: {
    // Global Typography
    textMain: '#FAFAFA',
    textSecondary: hexToRgba('#FAFAFA', 0.7),

    // Icons
    iconNormal: '#FAFAFA',
    iconActive: '#5A9EE6',

    // Sliders
    sliderTrackActive: '#5A9EE6',
    sliderTrackInactive: '#2A2A2A',
    sliderTrackCache: hexToRgba('#FAFAFA', 0.7),
    sliderThumb: '#5A9EE6',

    // Menu / Popover
    menuBackground: '#121212',
    menuBorder: '#3A3A3A',
    menuText: '#FAFAFA',
    menuSeparator: '#3A3A3A',

    // Overlays & Badges
    badgeBackground: hexToRgba('#121212', 0.6),

    // Interaction / Feedback
    ripple: '#3A3A3A',
    spinner: '#5A9EE6',

    // Status
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
};
