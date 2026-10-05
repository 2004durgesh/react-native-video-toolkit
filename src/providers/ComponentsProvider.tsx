import React, { createContext, useContext, useMemo } from 'react';
import type { VideoComponents } from '../types';
import { DefaultPressFeedback, DefaultSheet, DefaultSlider, DefaultSpinner } from '../components/defaults';

/**
 * The components the toolkit uses when none are provided.
 */
const defaultComponents: VideoComponents = {
  Sheet: DefaultSheet,
  Slider: DefaultSlider,
  Spinner: DefaultSpinner,
  PressFeedback: DefaultPressFeedback,
};

/**
 * The context for the replaceable components.
 * @internal
 */
export const ComponentsContext = createContext<VideoComponents | undefined>(undefined);

/**
 * Provides the replaceable components, merging the given ones over the defaults.
 * Rendered by `VideoProvider`; you don't need to use it directly.
 */
export const ComponentsProvider: React.FC<{
  components?: Partial<VideoComponents>;
  children: React.ReactNode;
}> = ({ components, children }) => {
  const { Sheet, Slider, Spinner, PressFeedback } = components ?? {};

  // Depend on each component rather than the object, so an inline `components={{ ... }}` doesn't
  // give every consumer a new context value on each render.
  const value = useMemo<VideoComponents>(
    () => ({
      Sheet: Sheet ?? defaultComponents.Sheet,
      Slider: Slider ?? defaultComponents.Slider,
      Spinner: Spinner ?? defaultComponents.Spinner,
      PressFeedback: PressFeedback ?? defaultComponents.PressFeedback,
    }),
    [Sheet, Slider, Spinner, PressFeedback]
  );

  return <ComponentsContext.Provider value={value}>{children}</ComponentsContext.Provider>;
};

/**
 * A hook to get the components the toolkit renders internally (`Sheet`, `Slider`, `Spinner`,
 * `PressFeedback`), with any replacements given to `VideoProvider` applied.
 *
 * Useful when building your own controls that should match the rest of the player.
 */
export const useVideoComponents = (): VideoComponents => {
  const context = useContext(ComponentsContext);
  if (context === undefined) {
    throw new Error('useVideoComponents must be used within a VideoProvider');
  }
  return context;
};
