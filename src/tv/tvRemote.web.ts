import type { TVRemoteEvent } from './tvRemote';

// The web has no TV remote events, and React Native Web has no `TVEventHandler` to look up
export type { TVRemoteEvent };

/** @internal */
export const addTVRemoteListener =
  (_listener: (event: TVRemoteEvent) => void): (() => void) =>
  () => {};
