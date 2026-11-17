import { createContext, useContext } from 'react';

/**
 * Shows and hides the player controls, and runs the provider's one auto-hide timer. The functions
 * are stable and read the latest state when called, so `useControlsVisibility()` callers share them
 * instead of each keeping its own timer.
 * @internal
 */
export interface ControlsController {
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

interface ControlsState {
  controlsVisible: boolean;
  isPlaying: boolean;
  config: {
    autoHideControls: boolean;
    autoHideDelay: number;
    onShowControls?: () => void;
    onHideControls?: () => void;
  };
}

interface ControlsControllerOptions {
  getState: () => ControlsState;
  subscribe: (listener: () => void) => () => void;
  setVisible: (visible: boolean) => void;
}

/**
 * `start()` begins following the player: playback starting or stopping, or a new auto-hide setting,
 * shows the controls and restarts the timer. It returns a function that stops following and cancels
 * the timer.
 * @internal
 */
export const createControlsController = ({ getState, subscribe, setVisible }: ControlsControllerOptions) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancelHide = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const hide = () => {
    cancelHide();
    setVisible(false);
    getState().config.onHideControls?.();
  };
  const show = () => {
    const state = getState();
    cancelHide();
    setVisible(true);
    if (state.config.autoHideControls && state.isPlaying) timer = setTimeout(hide, state.config.autoHideDelay);
    state.config.onShowControls?.();
  };
  const toggle = () => (getState().controlsVisible ? hide() : show());

  const start = () => {
    const watched = (state: ControlsState) => [
      state.isPlaying,
      state.config.autoHideControls,
      state.config.autoHideDelay,
    ];
    let last = watched(getState());
    show();
    const unsubscribe = subscribe(() => {
      const next = watched(getState());
      if (next.some((value, index) => value !== last[index])) {
        last = next;
        show();
      }
    });
    return () => {
      unsubscribe();
      cancelHide();
    };
  };

  return { show, hide, toggle, start };
};

/** @internal */
export const ControlsControllerContext = createContext<ControlsController | undefined>(undefined);

/** @internal */
export const useControlsController = (): ControlsController => {
  const controller = useContext(ControlsControllerContext);
  if (controller === undefined) throw new Error('This hook must be used within a VideoProvider');
  return controller;
};
