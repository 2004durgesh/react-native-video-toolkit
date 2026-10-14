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

/** @internal */
export const ControlsControllerContext = createContext<ControlsController | undefined>(undefined);

/**
 * The controls controller of the nearest `VideoProvider`.
 * @internal
 */
export const useControlsController = (): ControlsController => {
  const controller = useContext(ControlsControllerContext);
  if (controller === undefined) {
    throw new Error('useControlsVisibility must be used within a VideoProvider');
  }
  return controller;
};
