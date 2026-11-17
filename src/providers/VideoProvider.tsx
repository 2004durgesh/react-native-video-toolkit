import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { VideoPlayerConfig, VideoState, Theme, VideoComponents, ResolvedConfig, ResolvedTheme } from '../types';
import { defaultTheme } from '../themes';
import { type LayoutRectangle, type ScaledSize, Dimensions } from 'react-native';
import { SettingsProvider } from './SettingsProvider';
import { ComponentsProvider } from './ComponentsProvider';
import { createProgressStore, ProgressStoreContext } from './ProgressStore';
import { ControlsControllerContext, createControlsController } from './ControlsController';
import { PlayerCommandsContext, createPlayerCommands } from './PlayerCommands';
import { CaptionsControllerContext, createCaptionsController } from '../captions/CaptionsController';
import { PortalHost } from '@rn-primitives/portal';
import type { VideoRef } from 'react-native-video';
/**
 * Default configuration for the video player.
 */
const defaultConfig: ResolvedConfig = {
  autoHideControls: true,
  autoHideDelay: 5000,
  autoPlay: true,
  enableDoubleTapGestures: true,
  enablePanGestures: true,
  enableFullscreen: true,
  enableVolumeControl: true,
  enablePictureInPicture: false,
  enableScreenRotation: true,
  playbackRates: [0.5, 1, 1.25, 1.5, 2],
  useCustomAudioTracks: false,
  useCustomVideoTracks: false,
  captionRenderer: 'custom',
  progressUpdateInterval: 250,
};

/**
 * Represents the state of the VideoProvider.
 * @internal
 */
interface VideoProviderState extends VideoState {
  /**
   * The configuration for the video player, with the defaults filled in.
   */
  config: ResolvedConfig;
  /**
   * The theme for the video player, with the defaults filled in.
   */
  theme: ResolvedTheme;
  /**
   * A ref to the video component.
   */
  videoRef: React.MutableRefObject<VideoRef | null> | null;
  /**
   * Whether the controls are visible.
   */
  controlsVisible: boolean;
  /**
   * The layout of the video component.
   */
  videoLayout: LayoutRectangle;
  /**
   * The layout of the video wrapper View.
   * @deprecated Nothing reads it; will be removed in 2.0.
   */
  videoWrapperLayout: LayoutRectangle;
  /**
   * The video's own size, from the loaded source; 0 until it loads.
   */
  naturalSize: { width: number; height: number };
  /**
   * How much of the player's bottom edge the layout's controls cover while visible, so subtitles
   * can stay above them.
   */
  controlsInset: number;
  /**
   * How far up from the player's bottom edge the layout's centre controls start (the play button),
   * so subtitles that don't fit under them can hide while the controls show. 0 when unknown.
   */
  controlsCenterInset: number;
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
  /** @deprecated Does nothing, and never did. Use `useProgress().seek`. Will be removed in 2.0. */
  | { type: 'SEEK'; payload: number }
  | { type: 'TOGGLE_PLAY_PAUSE' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_PICTURE_IN_PICTURE'; payload: boolean }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_ENDED'; payload: boolean }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_BUFFERING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VIDEO_LAYOUT'; payload: LayoutRectangle }
  | { type: 'SET_VIDEO_WRAPPER_LAYOUT'; payload: LayoutRectangle }
  | { type: 'SET_NATURAL_SIZE'; payload: { width: number; height: number } }
  | { type: 'SET_CONTROLS_INSET'; payload: number }
  | { type: 'SET_CONTROLS_CENTER_INSET'; payload: number }
  | { type: 'SET_DIMENSIONS'; payload: { width: number; height: number } }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  | { type: 'SET_PORTAL_HOST_NAME'; payload: string };

/**
 * The state before the provider's props are applied.
 * @internal
 */
const initialState: Omit<VideoProviderState, 'dimensions' | 'portalHostName' | 'videoRef'> = {
  isPlaying: false,
  ended: false,
  duration: 0,
  buffering: false,
  muted: false,
  volume: 1,
  playbackRate: 1,
  fullscreen: false,
  pictureInPicture: false,
  error: null,
  config: defaultConfig,
  theme: defaultTheme,
  controlsVisible: true,
  videoLayout: { x: 0, y: 0, width: 0, height: 0 },
  videoWrapperLayout: { x: 0, y: 0, width: 0, height: 0 },
  naturalSize: { width: 0, height: 0 },
  controlsInset: 0,
  controlsCenterInset: 0,
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Whether two values hold the same data: plain objects and arrays compare by content at any depth,
 * everything else (functions included) by identity. Inline `config` and `theme` props arrive as new
 * objects on every render of the parent, and must not produce a new state when nothing changed.
 */
function isSameData(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) => isSameData((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

/**
 * `value` over `defaults`. Each nested group of the defaults (`colors`, `captions`...) merges one
 * level down, so a partial group keeps the rest of its defaults. An `undefined` value
 * (`config={{ autoHideDelay: props.delay }}` without a delay) keeps the default.
 */
function withDefaults<T extends object>(defaults: T, value: object | undefined): T {
  const merged: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [key, next] of Object.entries(value ?? {})) {
    if (next === undefined) continue;
    const fallback = merged[key];
    merged[key] = isPlainObject(fallback) && isPlainObject(next) ? withDefaults(fallback, next) : next;
  }
  return merged as T;
}

const isSameRect = (a: LayoutRectangle, b: LayoutRectangle) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

/**
 * The reducer for the video player state.
 *
 * Every action returns the current state when it changes nothing. Each new state re-renders every
 * `useVideo()` consumer, so a repeated value must not produce one.
 * @internal
 */
function videoReducer(state: VideoProviderState, action: Action): VideoProviderState {
  // Sets one field, keeping the state object when the value is already there
  const set = <K extends keyof VideoProviderState>(key: K, value: VideoProviderState[K]): VideoProviderState =>
    Object.is(state[key], value) ? state : { ...state, [key]: value };

  switch (action.type) {
    case 'INITIALIZE': {
      const theme = withDefaults(defaultTheme, action.payload.theme);
      const config = withDefaults(defaultConfig, action.payload.config);
      if (isSameData(theme, state.theme) && isSameData(config, state.config)) return state;
      return { ...state, theme, config };
    }
    case 'SET_CONTROLS_VISIBLE':
      return set('controlsVisible', action.payload);
    case 'SHOW_CONTROLS':
      return set('controlsVisible', true);
    case 'HIDE_CONTROLS':
      return set('controlsVisible', false);
    case 'SET_VIDEO_REF':
      return set('videoRef', action.payload);
    case 'SET_PLAYING':
      if (action.payload && state.ended) return { ...state, isPlaying: true, ended: false };
      return set('isPlaying', action.payload);
    case 'SET_ENDED':
      return set('ended', action.payload);
    case 'SET_DURATION':
      return set('duration', action.payload);
    case 'SET_BUFFERING':
      return set('buffering', action.payload);
    case 'SET_ERROR':
      return set('error', action.payload);
    case 'TOGGLE_PLAY_PAUSE':
      return { ...state, isPlaying: !state.isPlaying, ended: state.isPlaying && state.ended };
    case 'SET_VOLUME':
      return set('volume', Math.max(0, Math.min(1, action.payload)));
    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted };
    case 'SET_MUTED':
      return set('muted', action.payload);
    case 'TOGGLE_FULLSCREEN':
      return { ...state, fullscreen: !state.fullscreen };
    case 'SET_FULLSCREEN':
      return set('fullscreen', action.payload);
    case 'SET_PICTURE_IN_PICTURE':
      return set('pictureInPicture', action.payload);
    case 'SET_VIDEO_LAYOUT':
      return isSameRect(state.videoLayout, action.payload) ? state : { ...state, videoLayout: action.payload };
    case 'SET_VIDEO_WRAPPER_LAYOUT':
      return isSameRect(state.videoWrapperLayout, action.payload)
        ? state
        : { ...state, videoWrapperLayout: action.payload };
    case 'SET_NATURAL_SIZE':
      return state.naturalSize.width === action.payload.width && state.naturalSize.height === action.payload.height
        ? state
        : { ...state, naturalSize: action.payload };
    case 'SET_CONTROLS_INSET':
      return set('controlsInset', action.payload);
    case 'SET_CONTROLS_CENTER_INSET':
      return set('controlsCenterInset', action.payload);
    case 'SET_DIMENSIONS':
      return state.dimensions.width === action.payload.width && state.dimensions.height === action.payload.height
        ? state
        : { ...state, dimensions: action.payload };
    case 'SET_PLAYBACK_RATE':
      return set('playbackRate', action.payload);
    case 'SET_PORTAL_HOST_NAME':
      return set('portalHostName', action.payload);

    default:
      return state;
  }
}

/**
 * Holds a provider's player state outside React. Components subscribe to the part they use
 * (`useVideoSelector`), so a change re-renders only the components whose part changed;
 * `useVideo()` subscribes to all of it.
 * @internal
 */
export interface VideoStore {
  getState: () => VideoProviderState;
  dispatch: React.Dispatch<Action>;
  subscribe: (listener: () => void) => () => void;
}

function createVideoStore(initial: VideoProviderState): VideoStore {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch: (action) => {
      const next = videoReducer(state, action);
      if (next === state) return;
      state = next;
      // A copy, since a listener can dispatch again, and components subscribe and unsubscribe as they render
      for (const listener of [...listeners]) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * The provider's store. Its value never changes, so providing it re-renders nothing.
 * @internal
 */
export const VideoStoreContext = createContext<VideoStore | undefined>(undefined);

/**
 * Holds one player's state, config and theme. Players, layouts and hooks below it read from it, so
 * every `VideoPlayer` needs one above it; one at the app root can serve every screen.
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
  /**
   * Replacements for the components the toolkit renders internally (the menu `Sheet`, the
   * `Slider`, the buffering `Spinner` and the buttons' `PressFeedback`). Anything left out uses the
   * toolkit's default.
   */
  components?: Partial<VideoComponents>;
  /**
   * Name of a `VideoPortalHost` you render yourself, usually at the app root above your navigator.
   * The settings sheet then opens there, so it can cover tab bars and headers. When left out, the
   * provider renders its own host after its children.
   */
  portalHost?: string;
}> = ({ children, config, theme, components, portalHost }) => {
  const [portalId] = React.useState(() => `video-portal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const portalHostName = portalHost ?? portalId;
  // Owned here, so it's in the state from the first render; `VideoSurface` attaches the player to it
  const videoRef = useRef<VideoRef | null>(null);
  // The first render already has the consumer's config and theme, so it doesn't render with the
  // defaults first. That includes `autoPlay: false`, which would otherwise start playing.
  const [store] = React.useState(() => {
    const { width, height } = Dimensions.get('window');
    const initialized = videoReducer(
      { ...initialState, config: defaultConfig, dimensions: { width, height }, portalHostName, videoRef },
      { type: 'INITIALIZE', payload: { config, theme } }
    );
    return createVideoStore({ ...initialized, isPlaying: initialized.config.autoPlay });
  });

  // Later prop changes, applied before paint. The reducer ignores equal values, such as inline
  // objects recreated on every render. Not during render: that would re-render subscribers while
  // the provider renders.
  useLayoutEffect(() => {
    store.dispatch({ type: 'SET_PORTAL_HOST_NAME', payload: portalHostName });
    store.dispatch({ type: 'INITIALIZE', payload: { config, theme } });
  }, [store, portalHostName, config, theme]);

  // The window size, for fullscreen sizing and gestures
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) =>
      store.dispatch({ type: 'SET_DIMENSIONS', payload: { width: window.width, height: window.height } })
    );
    return () => subscription.remove();
  }, [store]);

  // One auto-hide timer per provider, shared by every `useControlsVisibility()` caller
  const [controls] = React.useState(() =>
    createControlsController({
      getState: store.getState,
      subscribe: store.subscribe,
      setVisible: (visible) => store.dispatch({ type: 'SET_CONTROLS_VISIBLE', payload: visible }),
    })
  );
  useEffect(() => controls.start(), [controls]);

  // The playback position lives in its own store, so progress events don't re-render this context's consumers
  const [progressStore] = React.useState(createProgressStore);
  const [commands] = React.useState(() =>
    createPlayerCommands({ getState: store.getState, dispatch: store.dispatch, progress: progressStore, controls })
  );

  // Works out which subtitle cues show, from the playback position and state
  const [captions] = React.useState(() =>
    createCaptionsController({
      getTime: () => progressStore.getSnapshot().currentTime,
      subscribeTime: progressStore.subscribe,
      getPlayback: () => store.getState(),
      subscribePlayback: store.subscribe,
      onError: (error) => store.getState().config.onCaptionError?.(error),
    })
  );
  useEffect(() => captions.start(), [captions]);

  return (
    <VideoStoreContext.Provider value={store}>
      <ProgressStoreContext.Provider value={progressStore}>
        <ControlsControllerContext.Provider value={controls}>
          <PlayerCommandsContext.Provider value={commands}>
            <CaptionsControllerContext.Provider value={captions}>
              <SettingsProvider>
                <ComponentsProvider components={components}>
                  {children}
                  {portalHost ? null : <PortalHost name={portalHostName} />}
                </ComponentsProvider>
              </SettingsProvider>
            </CaptionsControllerContext.Provider>
          </PlayerCommandsContext.Provider>
        </ControlsControllerContext.Provider>
      </ProgressStoreContext.Provider>
    </VideoStoreContext.Provider>
  );
};

/**
 * The store of the nearest `VideoProvider`.
 * @internal
 */
export const useVideoStore = (): VideoStore => {
  const store = useContext(VideoStoreContext);
  if (store === undefined) throw new Error('This hook must be used within a VideoProvider');
  return store;
};

/**
 * A hook to use the video context.
 * This hook provides access to the video state and dispatch function.
 *
 * The component re-renders on every state change. To re-render only when the part you use
 * changes, use {@link useVideoSelector}.
 */
export const useVideo = () => {
  const store = useVideoStore();
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  return { state, dispatch: store.dispatch };
};

/**
 * Subscribes to part of the video state: the component re-renders only when `selector` returns
 * something new, compared with `isEqual` (`Object.is` by default). Return a primitive or an object
 * already in the state, or pass `isEqual` for a selector that builds a new object.
 *
 * @example
 * const fullscreen = useVideoSelector((state) => state.fullscreen);
 */
export function useVideoSelector<T>(
  selector: (state: VideoProviderState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const store = useVideoStore();
  // The last selection, so an equal result keeps its identity and doesn't re-render
  const cache = useRef<{ state: VideoProviderState; selector: typeof selector; value: T } | null>(null);
  const getSnapshot = (): T => {
    const state = store.getState();
    const cached = cache.current;
    if (cached && cached.state === state && cached.selector === selector) return cached.value;
    const value = selector(state);
    if (cached && isEqual(cached.value, value)) {
      cache.current = { state, selector, value: cached.value };
      return cached.value;
    }
    cache.current = { state, selector, value };
    return value;
  };
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
