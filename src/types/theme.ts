/**
 * Represents the theme for the video player.
 */
export interface Theme {
  /**
   * The colors used in the theme.
   */
  colors: {
    /**
     * The primary color.
     */
    primary: string;
    /**
     * The secondary color.
     */
    secondary: string;
    /**
     * The accent color.
     */
    accent: string;
    /**
     * The background color.
     */
    background: string;
    /**
     * The overlay color.
     */
    overlay: string;
    /**
     * The text color.
     */
    text: string;
    /**
     * The error color.
     */
    error: string;
    /**
     * The success color.
     */
    success: string;
    /**
     * The border color.
     */
    border: string;
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
