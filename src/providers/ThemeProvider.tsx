import React, { createContext, useContext, useSyncExternalStore } from 'react';
import type { ResolvedTheme, Theme } from '../types';
import { VideoStoreContext } from './VideoProvider';

const ThemeContext = createContext<Theme | undefined>(undefined);

const noSubscription = () => () => {};

/**
 * Provides a theme to `useTheme()` callers below it.
 *
 * @deprecated The toolkit reads its theme from `VideoProvider`'s `theme` prop, so this provider
 * changes only what `useTheme()` returns, not the controls. Pass the theme to `VideoProvider`
 * instead; this will be removed in 2.0.
 * @param props - The theme and the children.
 * @returns {React.ReactElement} The provider.
 */
export const ThemeProvider: React.FC<{ theme: Theme; children: React.ReactNode }> = ({ theme, children }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);

/**
 * The theme of the nearest `VideoProvider`, with the defaults filled in.
 *
 * @returns {ResolvedTheme} The theme.
 */
export const useTheme = (): ResolvedTheme => {
  const legacy = useContext(ThemeContext);
  const store = useContext(VideoStoreContext);
  const getTheme = () => store?.getState().theme;
  const theme = useSyncExternalStore(store?.subscribe ?? noSubscription, getTheme, getTheme);
  const result = (legacy as ResolvedTheme | undefined) ?? theme;
  if (!result) throw new Error('useTheme must be used within a VideoProvider');
  return result;
};
