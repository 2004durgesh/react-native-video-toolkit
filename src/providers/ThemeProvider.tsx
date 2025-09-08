import React, { createContext, useContext } from 'react';
import type { Theme } from '../types';

/**
 * The context for the video player theme.
 */
const ThemeContext = createContext<Theme | undefined>(undefined);

/**
 * The provider component for the video player theme.
 * This component provides the theme to all its children.
 */
export const ThemeProvider: React.FC<{ theme: Theme; children: React.ReactNode }> = ({ theme, children }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

/**
 * A hook to use the theme context.
 * This hook provides access to the theme object.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
