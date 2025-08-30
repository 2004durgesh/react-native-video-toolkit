import { hexToRgba } from '../utils';
import type { Theme } from '../types';

/**
 * A minimal theme for the video player.
 */
export const minimalTheme: Theme = {
  colors: {
    primary: '#4F8EF7',
    secondary: '#7A7F8D',
    accent: '#F5B041',
    background: '#0B0B0D',
    overlay: hexToRgba('#0B0B0D', 0.6),
    text: '#FFFFFF',
    error: '#E74C3C',
    success: '#2ECC71',
    border: '#2F2F35',
  },
  sizing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  iconSizes: {
    sm: 16,
    md: 24,
    lg: 32,
  },
  borderRadius: 8,
  fonts: { regular: 'System', medium: 'System', bold: 'System' },
  fontSizes: {
    sm: 12,
    md: 14,
    lg: 16,
  },
  animations: { fast: 150, normal: 300, slow: 500 },
};
