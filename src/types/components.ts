import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

/**
 * Props the toolkit passes to the `Sheet` component, which hosts the settings `Menu`.
 *
 * The open state is owned by the toolkit: render your sheet open when `open` is `true`, and call
 * `onOpenChange(false)` when the user dismisses it (swipe down, backdrop tap, back button...).
 */
export interface SheetProps {
  /**
   * Whether the sheet should be shown.
   */
  open: boolean;
  /**
   * Call with `false` when the user dismisses the sheet.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * The menu content (header and current view). It already has access to the toolkit's state, so it
   * can be rendered inside a portal that sits outside `VideoProvider`.
   */
  children: ReactNode;
  /**
   * Style from `Menu.Content` (background color, padding, and `sheetStyle`).
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The toolkit's portal host name. The default sheet renders into it; custom sheets can ignore it.
   */
  portalHost?: string;
}

/**
 * Props the toolkit passes to the `Slider` component, used by `ProgressBar` and `VolumeControl`.
 *
 * Values are plain numbers. While the user drags, call `onValueChange`; the toolkit seeks or changes
 * the volume as values come in.
 */
export interface SliderProps {
  /**
   * Which control is rendering the slider, so one component can style each differently.
   */
  variant: 'progress' | 'volume';
  /**
   * The current value (seconds for `progress`, 0–1 for `volume`).
   */
  value: number;
  /**
   * The lowest value.
   */
  minimumValue: number;
  /**
   * The highest value (the video duration for `progress`, `1` for `volume`).
   */
  maximumValue: number;
  /**
   * How far the media is buffered, on the same scale as `value`. Only set for `progress`.
   */
  bufferedValue?: number;
  /**
   * Call while the user drags.
   */
  onValueChange: (value: number) => void;
  /**
   * Call when the user starts dragging.
   */
  onSlidingStart?: () => void;
  /**
   * Call when the user releases the slider.
   */
  onSlidingComplete?: (value: number) => void;
  /**
   * Track height requested by the control.
   */
  height: number;
  /**
   * Thumb size requested by the control.
   */
  thumbWidth: number;
  /**
   * Fixed width requested by the control, if any (`VolumeControl` sets one).
   */
  width?: number;
  /**
   * Colors from the player theme.
   */
  colors: {
    /** The filled part of the track. */
    active: string;
    /** The unfilled part of the track. */
    inactive: string;
    /** The buffered part of the track (`progress` only). */
    buffered?: string;
    /** The thumb. */
    thumb: string;
  };
}

/**
 * Props the toolkit passes to the `Spinner` component, shown while the video is buffering.
 */
export interface SpinnerProps {
  /**
   * Requested size.
   */
  size: 'small' | 'large';
  /**
   * Color from the player theme (or the `LoadingSpinner` `color` prop).
   */
  color: string;
  /**
   * Positioning style (centered over the video by default).
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props the toolkit passes to the `PressFeedback` component, which wraps every control button.
 *
 * It only provides visual feedback: the toolkit detects the tap itself (so it can coordinate with
 * the player's gestures), which means your component should not call any press handler. Any other
 * view props (accessibility, `testID`...) are forwarded; spread them onto your root view.
 */
export interface PressFeedbackProps extends Omit<ViewProps, 'children' | 'style'> {
  /**
   * The button content (usually an icon).
   */
  children: ReactNode;
  /**
   * Feedback color from the player theme (`theme.colors.ripple`).
   */
  color: string;
  /**
   * Style for the feedback container.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Components the toolkit renders internally and that you can replace through
 * `<VideoProvider components={...}>`. Anything you leave out uses the toolkit's default.
 */
export interface VideoComponents {
  /** Hosts the settings `Menu`. Default: a bottom sheet (a side panel on TV). */
  Sheet: ComponentType<SheetProps>;
  /** Used by `ProgressBar` and `VolumeControl`. Default: `react-native-awesome-slider`. */
  Slider: ComponentType<SliderProps>;
  /** Shown while buffering. Default: `ActivityIndicator`. */
  Spinner: ComponentType<SpinnerProps>;
  /** Wraps every control button. Default: a material ripple (none on web). */
  PressFeedback: ComponentType<PressFeedbackProps>;
}
