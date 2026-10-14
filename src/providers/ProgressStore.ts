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

/**
 * Holds the playback position outside the video state. It changes on every progress event, twice a
 * second while playing, and in the video state each change would re-render every `useVideo()`
 * consumer. Only `useProgress()` callers subscribe to it.
 * @internal
 */
export interface ProgressStore {
  getSnapshot: () => ProgressSnapshot;
  subscribe: (listener: () => void) => () => void;
  update: (next: Partial<ProgressSnapshot>) => void;
  /**
   * The same values as shared values, for UI-thread readers such as the default slider, which then
   * follows playback without re-rendering.
   */
  shared: { currentTime: SharedValue<number>; playableDuration: SharedValue<number> };
}

/**
 * Creates the store for one `VideoProvider`.
 * @internal
 */
export function createProgressStore(): ProgressStore {
  let snapshot: ProgressSnapshot = { currentTime: 0, playableDuration: 0 };
  const listeners = new Set<() => void>();
  const shared = { currentTime: makeMutable(0), playableDuration: makeMutable(0) };

  return {
    getSnapshot: () => snapshot,
    shared,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (next) => {
      const currentTime = next.currentTime ?? snapshot.currentTime;
      const playableDuration = next.playableDuration ?? snapshot.playableDuration;
      if (currentTime === snapshot.currentTime && playableDuration === snapshot.playableDuration) return;
      snapshot = { currentTime, playableDuration };
      shared.currentTime.value = currentTime;
      shared.playableDuration.value = playableDuration;
      listeners.forEach((listener) => listener());
    },
  };
}

/**
 * The provider's progress store. Its value never changes, so providing it re-renders nothing.
 * @internal
 */
export const ProgressStoreContext = createContext<ProgressStore | undefined>(undefined);

/**
 * The progress store of the nearest `VideoProvider`.
 * @internal
 */
export const useProgressStore = (): ProgressStore => {
  const store = useContext(ProgressStoreContext);
  if (store === undefined) {
    throw new Error('useProgress must be used within a VideoProvider');
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
