import { hexToRgba } from '../utils';
import type { Theme } from '../types';

/**
 * The default theme for the video player.
 */
export const defaultTheme: Theme = {
  colors: {
    primary: '#5A9EE6',
    secondary: '#2A2A2A',
    accent: '#3A3A3A',
    background: '#121212',
    overlay: hexToRgba('#121212', 0.6),
    text: '#FAFAFA',
    error: '#F25252',
    success: '#60D288',
    border: '#3A3A3A',
  },
  sizing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
  },
  iconSizes: {
    sm: 18,
    md: 28,
    lg: 40,
  },
  borderRadius: 12,
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
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
