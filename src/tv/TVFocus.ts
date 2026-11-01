import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ViewProps } from 'react-native';

/**
 * The highlight behind the focused control on TV, for themes without `tvFocus`.
 * @internal
 */
export const DEFAULT_TV_FOCUS_COLOR = 'rgba(255, 255, 255, 0.25)';

/**
 * Keep the D-pad's focus inside a view, on Android: react-native-tvos's `trapFocus*` props. Plain
 * React Native's types don't have them, and it ignores them.
 * @internal
 */
export const TRAP_FOCUS = {
  trapFocusUp: true,
  trapFocusDown: true,
  trapFocusLeft: true,
  trapFocusRight: true,
} as ViewProps;

/** @internal */
export const TRAP_FOCUS_HORIZONTAL = { trapFocusLeft: true, trapFocusRight: true } as ViewProps;

/**
 * `hasTVPreferredFocus`, which react-native-tvos uses to focus a view when it turns `true`. Plain
 * React Native's types mark it deprecated, having dropped TV, so it's passed untyped like the
 * `trapFocus*` props.
 * @internal
 */
export const tvPreferredFocus = (preferred: boolean): ViewProps =>
  ({ hasTVPreferredFocus: preferred }) as unknown as ViewProps;

/**
 * Makes a view a react-native-tvos focus guide: focusing it focuses its first focusable child, or
 * the one focused last. Ignored without the TV fork.
 * @internal
 */
export const TV_FOCUS_GUIDE = { autoFocus: true } as unknown as ViewProps;

/**
 * Moves the remote's focus to a view with react-native-tvos's `requestTVFocus`, which waits for a
 * view that isn't attached yet. Does nothing without the TV fork.
 * @internal
 */
export const requestTVFocus = (view: unknown): void => {
  (view as { requestTVFocus?: () => void } | null | undefined)?.requestTVFocus?.();
};

/**
 * Where the remote's focus should go next: the player surface while the controls are hidden, the
 * play button or the progress bar as they come up, the up-next card's "Play now", or the settings
 * button as the menu closes.
 * @internal
 */
export type TVFocusTarget = 'surface' | 'play' | 'progress' | 'upNext' | 'settings';

/**
 * Which kind of the player's views has focus, or `null` when focus is elsewhere on the screen.
 * @internal
 */
export type TVFocusHolder = 'surface' | 'progress' | 'button' | null;

/**
 * The TV focus state of one player.
 * @internal
 */
export interface TVFocus {
  /** Reported by the player's focusable views as they gain and lose focus. */
  setHolder: (holder: TVFocusHolder) => void;
  getHolder: () => TVFocusHolder;
  /** Whether the player has the focus, or lost it a moment ago (as its views unmount). */
  hadFocusRecently: () => boolean;
  /** The view that should take focus next. Views read it as `hasTVPreferredFocus`. */
  getTarget: () => TVFocusTarget | null;
  setTarget: (target: TVFocusTarget | null) => void;
  subscribe: (listener: () => void) => () => void;
}

/** @internal */
export const createTVFocus = (): TVFocus => {
  let holder: TVFocusHolder = null;
  let lostAt = 0;
  let target: TVFocusTarget | null = null;
  const listeners = new Set<() => void>();
  return {
    setHolder: (next) => {
      if (holder !== null && next === null) lostAt = Date.now();
      holder = next;
    },
    getHolder: () => holder,
    hadFocusRecently: () => holder !== null || Date.now() - lostAt < 500,
    getTarget: () => target,
    setTarget: (next) => {
      if (next === target) return;
      target = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/**
 * The TV focus of the nearest player; `null` off a TV, or outside a player.
 * @internal
 */
export const TVFocusContext = createContext<TVFocus | null>(null);

/**
 * Whether the controls around a view can take focus: off while they're faded out, so the remote
 * can't land on a button nobody can see. Only TV provides it; elsewhere it stays `true`.
 * @internal
 */
export const ControlsFocusableContext = createContext(true);

const subscribeNever = () => () => {};
const getNull = () => null;

/**
 * Whether `target` should take focus now. The view passes it as `hasTVPreferredFocus`, which
 * focuses it when it turns `true`.
 * @internal
 */
export const useTVPreferredFocus = (target: TVFocusTarget | undefined): boolean => {
  const focus = useContext(TVFocusContext);
  const current = useSyncExternalStore(
    focus?.subscribe ?? subscribeNever,
    focus?.getTarget ?? getNull,
    focus?.getTarget ?? getNull
  );
  return target !== undefined && current === target;
};
