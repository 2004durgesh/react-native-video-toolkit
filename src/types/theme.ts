/**
 * Represents the theme for the video player.
 */
export interface Theme {
  /**
   * The colors used in the theme.
   */
  colors: {
    // Global Typography
    textMain: string;
    textSecondary: string;

    // Icons
    iconNormal: string;
    iconActive: string;

    // Sliders (Progress Bar & Volume)
    sliderTrackActive: string;
    sliderTrackInactive: string;
    sliderTrackCache: string;
    sliderThumb: string;

    // Menu / Popover
    menuBackground: string;
    menuBorder: string;
    menuText: string;
    menuSeparator: string;

    // Overlays & Badges
    badgeBackground: string;

    // Interaction / Feedback
    ripple: string;
    spinner: string;

    // Status
    error: string;
    success: string;
  };
  /**
   * The icon sizes used in the theme.
   */
  iconSizes: {
    sm: number;
    md: number;
    lg: number;
  };
  /**
   * The font sizes used in the theme.
   */
  fontSizes: {
    sm: number;
    md: number;
    lg: number;
  };
  /**
   * The animation durations used in the theme.
   */
  animations: {
    fast: number;
    normal: number;
    slow: number;
  };
}
