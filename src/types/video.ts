import type { VideoTrack } from 'react-native-video';
import type { CaptionError } from '../captions/types';

/**
 * A video quality you list yourself, through `VideoPlayer`'s `customVideoTracks`.
 */
export interface CustomVideoTrack extends Partial<VideoTrack> {
  /**
   * User-friendly label to display in the UI (e.g., "Auto", "1080p", "720p HD").
   * If not provided, the height will be used to generate a label.
   */
  label?: string;
  /**
   * A link to this quality's own stream. The toolkit doesn't read it: it selects tracks by `height`.
   * Keep it here if you switch `source` yourself when the viewer picks this track.
   */
  uri?: string;
  /**
   * The height of the video track in pixels.
   * Used for track selection by resolution.
   */
  height: number;
}

/**
 * Represents the state of the video player.
 */
export interface VideoState {
  /**
   * Whether the video is currently playing.
   */
  isPlaying: boolean;
  /**
   * Whether playback reached the end of the source. Cleared when it plays again or a new source loads.
   */
  ended: boolean;
  /**
   * The duration of the video in seconds.
   */
  duration: number;
  /**
   * Whether the video is currently buffering.
   */
  buffering: boolean;
  /**
   * Whether the video is muted.
   */
  muted: boolean;
  /**
   * The volume of the video, between 0 and 1.
   */
  volume: number;
  /**
   * The playback speed, where 1 is normal speed.
   */
  playbackRate: number;
  /**
   * Whether the video is in fullscreen mode.
   */
  fullscreen: boolean;
  /**
   * Whether the video is playing in picture-in-picture.
   */
  pictureInPicture: boolean;
  /**
   * An error message, if any.
   */
  error: string | null;
}

/**
 * Represents the configuration for the video player.
 */
export interface VideoPlayerConfig {
  /**
   * Whether the controls hide by themselves `autoHideDelay` after they show, while the video plays.
   * @default true
   */
  autoHideControls: boolean;
  /**
   * Whether to automatically play the video when it is loaded.
   * @default true
   */
  autoPlay: boolean;
  /**
   * The delay in milliseconds before the controls are hidden.
   * @default 5000
   */
  autoHideDelay: number;
  /**
   * Whether to enable double tap gestures to seek forward and backward.
   * @default true
   */
  enableDoubleTapGestures: boolean;
  /**
   * Whether to enable the fullscreen button.
   * @default true
   */
  enableFullscreen: boolean;
  /**
   * Has no effect: nothing reads it.
   * @deprecated The toolkit never read this option. Leave it out; it will be removed in 2.0.
   */
  enableVolumeControl: boolean;
  /**
   * Whether to show the picture-in-picture button. Off by default, because picture-in-picture needs
   * native setup: the `audio` background mode on iOS and `supportsPictureInPicture` on Android.
   */
  enablePictureInPicture: boolean;
  /**
   * Whether the player's vertical pans and swipes call `gestureProps`' pan handlers.
   * @default true
   */
  enablePanGestures: boolean;
  /**
   * Whether entering fullscreen turns the screen to landscape. Exiting turns phones back to portrait
   * and lets tablets rotate freely.
   * @default true
   */
  enableScreenRotation: boolean;
  /**
   * The speeds the settings menu offers, where 1 is normal speed.
   * @default [0.5, 1, 1.25, 1.5, 2]
   */
  playbackRates: number[];
  /**
   * Has no effect: passing `customAudioTracks` to `VideoPlayer` turns them on.
   * @deprecated Will be removed in 2.0.
   */
  useCustomAudioTracks?: boolean;
  /**
   * Has no effect: passing `customVideoTracks` to `VideoPlayer` turns them on.
   * @deprecated Will be removed in 2.0.
   */
  useCustomVideoTracks?: boolean;
  /**
   * A callback function that is called when the player enters fullscreen mode.
   */
  onEnterFullscreen?: () => void;
  /**
   * A callback function that is called when the player exits fullscreen mode.
   */
  onExitFullscreen?: () => void;
  /**
   * A callback function that is called when the player enters picture-in-picture.
   */
  onEnterPictureInPicture?: () => void;
  /**
   * A callback function that is called when the player exits picture-in-picture.
   */
  onExitPictureInPicture?: () => void;
  /**
   * A callback function that is called when the controls are hidden.
   */
  onHideControls?: () => void;
  /**
   * A callback function that is called when the controls are shown.
   */
  onShowControls?: () => void;
  /**
   * Who draws subtitles from files (`source.textTracks`) and HLS subtitle renditions. `'custom'`:
   * the toolkit, styled with `theme.captions`. `'native'`: react-native-video, as before.
   * Subtitles embedded in MP4 or DASH files, and HLS closed captions, are always drawn natively.
   * @default 'custom'
   */
  captionRenderer?: 'custom' | 'native';
  /**
   * Called when subtitles fail to load or parse. The video keeps playing without them.
   */
  onCaptionError?: (error: CaptionError) => void;
  /**
   * How often the player reports its position, in milliseconds. Subtitles stay in sync between
   * reports, so this mostly sets how smoothly `useProgress()` updates.
   * @default 250
   */
  progressUpdateInterval?: number;
  /**
   * The screen's safe-area insets, for example from `react-native-safe-area-context`'s
   * `useSafeAreaInsets()`. Subtitles keep clear of them in fullscreen, and the default settings
   * sheet keeps its last row above the bottom one (Android's navigation bar, the home indicator).
   */
  safeAreaInsets?: { top?: number; bottom?: number; left?: number; right?: number };
}

/**
 * The config after the provider fills in the defaults: the options with a default are always set.
 * @internal
 */
export type ResolvedConfig = VideoPlayerConfig &
  Required<
    Pick<
      VideoPlayerConfig,
      'useCustomAudioTracks' | 'useCustomVideoTracks' | 'captionRenderer' | 'progressUpdateInterval'
    >
  >;
