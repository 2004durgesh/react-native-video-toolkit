import React, { createContext, useReducer, useContext, useEffect, useMemo } from 'react';
import type { VideoPlayerConfig, VideoState, Theme } from '../types';
import { defaultTheme } from '../themes';
import { type LayoutRectangle, Dimensions } from 'react-native';
import { ThemeProvider } from './ThemeProvider';
import { SettingsProvider } from './SettingsProvider';
import { PortalHost } from '@rn-primitives/portal';
import type { VideoRef } from 'react-native-video';
/**
 * Default configuration for the video player.
 */
const defaultConfig: VideoPlayerConfig = {
  autoHideControls: true,
  autoHideDelay: 5000,
  autoPlay: true,
  enableDoubleTapGestures: true,
  enablePanGestures: true,
  enableFullscreen: true,
  enableVolumeControl: true,
  enableScreenRotation: true,
  playbackRates: [0.5, 1, 1.25, 1.5, 2],
  useCustomAudioTracks: false,
  useCustomVideoTracks: false,
};

/**
 * Represents the state of the VideoProvider.
 * @internal
 */
interface VideoProviderState extends VideoState {
  /**
   * The configuration for the video player.
   */
  config: VideoPlayerConfig;
  /**
   * The theme for the video player.
   */
  theme: Theme;
  /**
   * A ref to the video component.
   */
  videoRef: React.RefObject<VideoRef> | null;
  /**
   * Whether the controls are visible.
   */
  controlsVisible: boolean;
  /**
   * A timeout ref for hiding the controls.
   */
  hideTimeoutRef: NodeJS.Timeout | null;
  /**
   * The layout of the video component.
   */
  videoLayout: LayoutRectangle;
  /**
   * The layout of the video wrapper View.
   */
  videoWrapperLayout: LayoutRectangle;
  /**
   * The dimensions of the screen.
   */
  dimensions: { width: number; height: number };
  /**
   * A unique identifier for the portal host associated with this provider.
   */
  portalHostName: string;
}

/**
 * Represents the actions that can be dispatched to the video reducer.
 * @internal
 */
type Action =
  | { type: 'INITIALIZE'; payload: { theme?: Partial<Theme>; config?: Partial<VideoPlayerConfig> } }
  | { type: 'SET_VIDEO_REF'; payload: React.RefObject<any> }
  | { type: 'SHOW_CONTROLS' }
  | { type: 'HIDE_CONTROLS' }
  | { type: 'SET_CONTROLS_VISIBLE'; payload: boolean }
  | { type: 'SEEK'; payload: number }
  | { type: 'TOGGLE_PLAY_PAUSE' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_PLAYABLE_DURATION'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_BUFFERING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HIDE_TIMEOUT'; payload: NodeJS.Timeout | null }
  | { type: 'SET_VIDEO_LAYOUT'; payload: LayoutRectangle }
  | { type: 'SET_VIDEO_WRAPPER_LAYOUT'; payload: LayoutRectangle }
  | { type: 'SET_DIMENSIONS'; payload: { width: number; height: number } }
  | { type: 'SET_PLAYBACK_RATE'; payload: number };

/**
 * The initial state for the VideoProvider.
 * @internal
 */
const initialState: VideoProviderState = {
  isPlaying: defaultConfig.autoPlay,
  currentTime: 0,
  playableDuration: 0,
  duration: 0,
  buffering: false,
  muted: false,
  volume: 1,
  playbackRate: 1,
  fullscreen: false,
  error: null,
  config: defaultConfig,
  theme: defaultTheme,
  videoRef: null,
  controlsVisible: true,
  hideTimeoutRef: null,
  videoLayout: { x: 0, y: 0, width: 0, height: 0 },
  videoWrapperLayout: { x: 0, y: 0, width: 0, height: 0 },
  dimensions: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  portalHostName: 'default-portal-host',
};

/**
 * The context for the video player.
 * @internal
 */
const VideoContext = createContext<
  | {
      state: VideoProviderState;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

/**
 * The reducer for the video player state.
 * @internal
 */
function videoReducer(state: VideoProviderState, action: Action): VideoProviderState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        theme: {
          ...defaultTheme,
          ...action.payload.theme,
          colors: { ...defaultTheme.colors, ...action.payload.theme?.colors },
          fontSizes: { ...defaultTheme.fontSizes, ...action.payload.theme?.fontSizes },
          animations: { ...defaultTheme.animations, ...action.payload.theme?.animations },
        },
        config: { ...defaultConfig, ...action.payload.config },
      };
    case 'SET_CONTROLS_VISIBLE':
      return { ...state, controlsVisible: action.payload };
    case 'SHOW_CONTROLS':
      return { ...state, controlsVisible: true };
    case 'HIDE_CONTROLS':
      return { ...state, controlsVisible: false };
    case 'SET_VIDEO_REF':
      return { ...state, videoRef: action.payload };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_PLAYABLE_DURATION':
      return { ...state, playableDuration: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_BUFFERING':
      return { ...state, buffering: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'TOGGLE_PLAY_PAUSE':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) };
    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted };
    case 'TOGGLE_FULLSCREEN':
      return { ...state, fullscreen: !state.fullscreen };
    case 'SET_HIDE_TIMEOUT':
      return { ...state, hideTimeoutRef: action.payload };
    case 'SET_VIDEO_LAYOUT':
      return { ...state, videoLayout: action.payload };
    case 'SET_VIDEO_WRAPPER_LAYOUT':
      return { ...state, videoWrapperLayout: action.payload };
    case 'SET_DIMENSIONS':
      return { ...state, dimensions: action.payload };
    case 'SET_PLAYBACK_RATE':
      return { ...state, playbackRate: action.payload };

    default:
      return state;
  }
}

/**
 * The provider component for the video player.
 * This component provides the video state to all its children.
 */
export const VideoProvider: React.FC<{
  children: React.ReactNode;
  /**
   * The configuration for the video player.
   */
  config?: Partial<VideoPlayerConfig>;
  /**
   * The theme for the video player.
   */
  theme?: Partial<Theme>;
}> = ({ children, config, theme }) => {
  const [portalId] = React.useState(() => `video-portal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [state, dispatch] = useReducer(videoReducer, { ...initialState, portalHostName: portalId });

  // Memoize config and theme to prevent infinite re-renders if passed as inline objects
  const memoizedConfig = useMemo(() => config, [config]);
  const memoizedTheme = useMemo(() => theme, [theme]);

  useEffect(() => {
    dispatch({ type: 'INITIALIZE', payload: { config: memoizedConfig, theme: memoizedTheme } });
  }, [memoizedConfig, memoizedTheme]);

  return (
    <VideoContext.Provider value={{ state, dispatch }}>
      <ThemeProvider theme={state.theme}>
        <SettingsProvider>
          {children}
          <PortalHost name={state.portalHostName} />
        </SettingsProvider>
      </ThemeProvider>
    </VideoContext.Provider>
  );
};

/**
 * A hook to use the video context.
 * This hook provides access to the video state and dispatch function.
 */
export const useVideo = () => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }

  return { ...context };
};
