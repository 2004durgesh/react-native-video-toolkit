import React, { useContext, type ContextType } from 'react';
import { VideoContext } from './VideoProvider';
import { ThemeContext } from './ThemeProvider';
import { SettingsContext } from './SettingsProvider';
import { ComponentsContext } from './ComponentsProvider';

/**
 * Snapshot of the toolkit's context values.
 * @internal
 */
export interface BridgedContexts {
  video: ContextType<typeof VideoContext>;
  theme: ContextType<typeof ThemeContext>;
  settings: ContextType<typeof SettingsContext>;
  components: ContextType<typeof ComponentsContext>;
}

/**
 * Reads the toolkit's context values so they can be handed to a `ContextBridge`.
 * @internal
 */
export const useBridgedContexts = (): BridgedContexts => ({
  video: useContext(VideoContext),
  theme: useContext(ThemeContext),
  settings: useContext(SettingsContext),
  components: useContext(ComponentsContext),
});

/**
 * Re-provides the toolkit's contexts around `children`.
 *
 * Custom sheets often render through their own portal (for example `@gorhom/bottom-sheet`'s
 * `BottomSheetModalProvider`), which can sit outside `VideoProvider`. Wrapping the menu content in
 * this bridge keeps `useVideo`, `useTheme`, `useSettings`... working wherever it ends up.
 * @internal
 */
export const ContextBridge: React.FC<{ contexts: BridgedContexts; children: React.ReactNode }> = ({
  contexts,
  children,
}) => (
  <VideoContext.Provider value={contexts.video}>
    <ThemeContext.Provider value={contexts.theme}>
      <SettingsContext.Provider value={contexts.settings}>
        <ComponentsContext.Provider value={contexts.components}>{children}</ComponentsContext.Provider>
      </SettingsContext.Provider>
    </ThemeContext.Provider>
  </VideoContext.Provider>
);
