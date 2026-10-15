import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import type { VideoPlayerConfig, VideoState, Theme, VideoComponents } from '../types';
import { defaultTheme } from '../themes';
import { type LayoutRectangle, Dimensions } from 'react-native';
import { ThemeProvider } from './ThemeProvider';
import { SettingsProvider } from './SettingsProvider';
import { ComponentsProvider } from './ComponentsProvider';
import { createProgressStore, ProgressStoreContext } from './ProgressStore';
import { ControlsControllerContext, type ControlsController } from './ControlsController';
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
  enablePictureInPicture: false,
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
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_PICTURE_IN_PICTURE'; payload: boolean }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_ENDED'; payload: boolean }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_BUFFERING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VIDEO_LAYOUT'; payload: LayoutRectangle }
  | { type: 'SET_VIDEO_WRAPPER_LAYOUT'; payload: LayoutRectangle }
  | { type: 'SET_DIMENSIONS'; payload: { width: number; height: number } }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  | { type: 'SET_PORTAL_HOST_NAME'; payload: string };

/**
 * The initial state for the VideoProvider.
 * @internal
 */
const initialState: VideoProviderState = {
  isPlaying: defaultConfig.autoPlay,
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
  videoRef: null,
  controlsVisible: true,
  videoLayout: { x: 0, y: 0, width: 0, height: 0 },
  videoWrapperLayout: { x: 0, y: 0, width: 0, height: 0 },
  dimensions: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  portalHostName: 'default-portal-host',
};

/**
 * Whether two values are equal, comparing plain objects and arrays one level deep. Enough for the
 * config and theme, whose nested values (colors, font sizes, playback rates) are flat.
 */
function isEqualOneLevel(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) => {
    const aValue = (a as Record<string, unknown>)[key];
    const bValue = (b as Record<string, unknown>)[key];
    if (Object.is(aValue, bValue)) return true;
    if (typeof aValue !== 'object' || typeof bValue !== 'object' || aValue === null || bValue === null) return false;
    const aInner = aValue as Record<string, unknown>;
    const bInner = bValue as Record<string, unknown>;
    const innerKeys = Object.keys(aInner);
    return innerKeys.length === Object.keys(bInner).length && innerKeys.every((k) => Object.is(aInner[k], bInner[k]));
  });
}

/** The object without its `undefined` values, so spreading it over defaults keeps them. */
function definedOnly<T extends object>(value: T | undefined): Partial<T> {
  if (!value) return {};
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
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
      // `definedOnly`: an explicit `undefined` (`config={{ autoHideDelay: props.delay }}` without a
      // delay) keeps the default instead of replacing it
      const theme = {
        ...defaultTheme,
        ...definedOnly(action.payload.theme),
        colors: { ...defaultTheme.colors, ...definedOnly(action.payload.theme?.colors) },
        fontSizes: { ...defaultTheme.fontSizes, ...definedOnly(action.payload.theme?.fontSizes) },
        animations: { ...defaultTheme.animations, ...definedOnly(action.payload.theme?.animations) },
      };
      const config = { ...defaultConfig, ...definedOnly(action.payload.config) };
      // Inline config and theme objects arrive as new objects on every render of the parent
      if (isEqualOneLevel(theme, state.theme) && isEqualOneLevel(config, state.config)) return state;
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
    const initialized = videoReducer(
      { ...initialState, portalHostName, videoRef },
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

  const getTheme = () => store.getState().theme;
  // The third argument is for server rendering (the docs site prerenders players), which has no store updates
  const storedTheme = useSyncExternalStore(store.subscribe, getTheme, getTheme);

  // One auto-hide timer per provider. Each `useControlsVisibility()` caller used to keep its own,
  // so a timer started by one wasn't cleared by another and the controls could hide early.
  const [hideTimer] = React.useState<{ current: ReturnType<typeof setTimeout> | null }>(() => ({ current: null }));
  const controls = useMemo<ControlsController>(() => {
    const cancelHide = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = null;
    };
    const hide = () => {
      cancelHide();
      store.dispatch({ type: 'HIDE_CONTROLS' });
      store.getState().config.onHideControls?.();
    };
    const show = () => {
      const latest = store.getState();
      cancelHide();
      // A no-op for the state when the controls are already visible, so nothing re-renders
      store.dispatch({ type: 'SHOW_CONTROLS' });
      if (latest.config.autoHideControls && latest.isPlaying) {
        hideTimer.current = setTimeout(hide, latest.config.autoHideDelay);
      }
      latest.config.onShowControls?.();
    };
    const toggle = () => (store.getState().controlsVisible ? hide() : show());
    return { show, hide, toggle };
  }, [store, hideTimer]);

  // Playback starting or stopping, or a new auto-hide setting, shows the controls and restarts the
  // timer. A store subscription, so it runs with the new state as soon as it's dispatched. The
  // cleanup also stops the timer when the provider unmounts.
  useEffect(() => {
    const watched = (s: VideoProviderState) => [s.isPlaying, s.config.autoHideControls, s.config.autoHideDelay];
    let last = watched(store.getState());
    controls.show();
    const unsubscribe = store.subscribe(() => {
      const next = watched(store.getState());
      if (next.some((value, index) => value !== last[index])) {
        last = next;
        controls.show();
      }
    });
    return () => {
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [store, controls, hideTimer]);
  // The playback position lives in its own store, so progress events don't re-render this context's consumers
  const [progressStore] = React.useState(createProgressStore);

  return (
    <VideoStoreContext.Provider value={store}>
      <ProgressStoreContext.Provider value={progressStore}>
        <ControlsControllerContext.Provider value={controls}>
          <ThemeProvider theme={storedTheme}>
            <SettingsProvider>
              <ComponentsProvider components={components}>
                {children}
                {portalHost ? null : <PortalHost name={portalHostName} />}
              </ComponentsProvider>
            </SettingsProvider>
          </ThemeProvider>
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
  if (store === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
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

/**
 * Whether two objects have the same keys with `Object.is`-equal values. For `useVideoSelector`
 * selectors that pick several fields.
 * @internal
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) => Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}
