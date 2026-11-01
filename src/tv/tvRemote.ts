import * as ReactNative from 'react-native';

/**
 * A remote button press, as react-native-tvos reports it.
 * @internal
 */
export interface TVRemoteEvent {
  /** `select`, `up`, `down`, `left`, `right`, `playPause`, `play`, `pause`, `fastForward`, `rewind`, … */
  eventType: string;
  /** 0 when the button goes down and 1 when it comes up, on platforms that report both. */
  eventKeyAction?: number | null;
}

type TVEventHandlerModule = {
  addListener: (listener: (event: TVRemoteEvent) => void) => { remove: () => void };
};

/**
 * Listens to the TV remote. Its events come from react-native-tvos, which the toolkit doesn't
 * require: plain React Native has no `TVEventHandler`, so it's looked up rather than imported, and
 * this listens to nothing there.
 * @returns A function that stops listening.
 * @internal
 */
export const addTVRemoteListener = (listener: (event: TVRemoteEvent) => void): (() => void) => {
  const handler = (ReactNative as unknown as { TVEventHandler?: TVEventHandlerModule }).TVEventHandler;
  const subscription = handler?.addListener(listener);
  return () => subscription?.remove();
};
