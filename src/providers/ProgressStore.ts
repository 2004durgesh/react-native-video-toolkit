import { createContext, useContext, useSyncExternalStore } from 'react';
import { makeMutable, type SharedValue } from 'react-native-reanimated';

/**
 * The playback position, which changes on every progress event.
 */
export interface ProgressSnapshot {
  /**
   * The current time of the video in seconds.
   */
  currentTime: number;
  /**
   * The playable (buffered) duration of the video in seconds.
   */
  playableDuration: number;
}

/** Why the position changed: the player reported it, or something else set it. @internal */
export type ProgressChange = 'player' | 'seek';

/**
 * Holds the playback position outside the video state. It changes on every progress event while
 * playing (`config.progressUpdateInterval`), and in the video state each change would re-render every
 * `useVideo()` consumer.
 * @internal
 */
export interface ProgressStore {
  getSnapshot: () => ProgressSnapshot;
  /**
   * Calls `listener` when the position changes, with why: `'player'` for the player's own report
   * (sent even when the position is unchanged), `'seek'` for anything else.
   */
  subscribe: (listener: (cause: ProgressChange) => void) => () => void;
  /** Sets the position from anything but the player: a seek, the start of a new source. */
  update: (next: Partial<ProgressSnapshot>) => void;
  /** The player reports its position. Only `VideoSurface` calls this. */
  report: (next: Partial<ProgressSnapshot>) => void;
  /**
   * Shows a position without the player being there: while set, it's the current time, and
   * playback doesn't move it. For scrubbing, which seeks once at the end. `null` goes back to
   * following playback.
   */
  setPreview: (time: number | null) => void;
  /**
   * The same values as shared values, for UI-thread readers such as the default slider, which then
   * follows playback without re-rendering.
   */
  shared: { currentTime: SharedValue<number>; playableDuration: SharedValue<number> };
}

/** @internal */
export function createProgressStore(): ProgressStore {
  let snapshot: ProgressSnapshot = { currentTime: 0, playableDuration: 0 };
  let preview: number | null = null;
  const listeners = new Set<Parameters<ProgressStore['subscribe']>[0]>();
  const shared = { currentTime: makeMutable(0), playableDuration: makeMutable(0) };

  const publish = (currentTime: number, playableDuration: number, cause: ProgressChange) => {
    const unchanged = currentTime === snapshot.currentTime && playableDuration === snapshot.playableDuration;
    if (unchanged && cause === 'seek') return;
    if (!unchanged) {
      snapshot = { currentTime, playableDuration };
      shared.currentTime.value = currentTime;
      shared.playableDuration.value = playableDuration;
    }
    listeners.forEach((listener) => listener(cause));
  };
  const set = (next: Partial<ProgressSnapshot>, cause: ProgressChange) => {
    const playableDuration = next.playableDuration ?? snapshot.playableDuration;
    const currentTime = preview ?? next.currentTime ?? snapshot.currentTime;
    publish(currentTime, playableDuration, cause);
  };

  return {
    getSnapshot: () => snapshot,
    shared,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (next) => set(next, 'seek'),
    report: (next) => set(next, 'player'),
    setPreview: (time) => {
      preview = time;
      if (time !== null) publish(time, snapshot.playableDuration, 'seek');
    },
  };
}

/**
 * The provider's progress store. Its value never changes, so providing it re-renders nothing.
 * @internal
 */
export const ProgressStoreContext = createContext<ProgressStore | undefined>(undefined);

/** @internal */
export const useProgressStore = (): ProgressStore => {
  const store = useContext(ProgressStoreContext);
  if (store === undefined) {
    throw new Error('This hook must be used within a VideoProvider');
  }
  return store;
};

/**
 * Subscribes to part of the playback position. The component re-renders only when the selected
 * value changes, so `select` must return a primitive (for example the whole second).
 * @internal
 */
export const useProgressValue = <T>(select: (snapshot: ProgressSnapshot) => T): T => {
  const store = useProgressStore();
  const getSelection = () => select(store.getSnapshot());
  // The same snapshot for server rendering, which React requires there
  return useSyncExternalStore(store.subscribe, getSelection, getSelection);
};
