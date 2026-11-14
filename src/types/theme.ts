import type { TextStyle } from 'react-native';

/**
 * How subtitles look, when the toolkit draws them (`config.captionRenderer: 'custom'`).
 */
export interface CaptionsTheme {
  /** The font. The system font by default. */
  fontFamily?: string;
  /**
   * The text size. `'auto'` follows the video's size: about 5.5% of the picture's height, from 12
   * to 28.
   */
  fontSize: number | 'auto';
  fontWeight?: TextStyle['fontWeight'];
  color: string;
  /** The line height as a multiple of the font size; tall scripts need room. */
  lineHeightMultiplier: number;
  letterSpacing?: number;
  textAlign: 'left' | 'center' | 'right';
  textTransform?: TextStyle['textTransform'];
  /** The box behind the text. Use `'transparent'` with an outline or shadow instead. */
  backgroundColor: string;
  borderRadius: number;
  paddingHorizontal: number;
  paddingVertical: number;
  /** An outline around the letters, drawn as offset copies of the text. 0 for none. */
  outlineWidth: number;
  outlineColor: string;
  /** A drop shadow behind the letters. */
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowRadius?: number;
  /**
   * `'video'` keeps subtitles on the picture. `'bars'` puts them in the black bar under a
   * letterboxed picture when there's room, and on the picture otherwise.
   */
  position: 'video' | 'bars';
  /** The gap under subtitles, as a share of the picture's height. */
  bottomMargin: number;
  /** The widest subtitles get, as a share of the picture's width. */
  maxWidth: number;
  /** Lines per cue before the rest is cut off. */
  maxLines: number;
}

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

    // Buttons (filled primary and outlined secondary, e.g. UpNext's "Play now" and "Cancel")
    buttonPrimaryBackground?: string;
    buttonPrimaryText?: string;
    buttonSecondaryBorder?: string;
    buttonSecondaryText?: string;

    // Overlays & Badges
    badgeBackground: string;
    scrim?: string;

    // Interaction / Feedback
    ripple: string;
    /** Highlight behind the focused control on TV. */
    tvFocus?: string;
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
  /**
   * How subtitles look. Any key left out keeps the default.
   */
  captions?: Partial<CaptionsTheme>;
}
