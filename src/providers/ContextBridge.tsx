import React, { useContext, type ContextType } from 'react';
import { VideoStoreContext } from './VideoProvider';
import { ThemeContext } from './ThemeProvider';
import { SettingsContext } from './SettingsProvider';
import { ComponentsContext } from './ComponentsProvider';
import { ProgressStoreContext } from './ProgressStore';
import { ControlsControllerContext } from './ControlsController';

/**
 * Snapshot of the toolkit's context values.
 * @internal
 */
export interface BridgedContexts {
  video: ContextType<typeof VideoStoreContext>;
  progress: ContextType<typeof ProgressStoreContext>;
  controls: ContextType<typeof ControlsControllerContext>;
  theme: ContextType<typeof ThemeContext>;
  settings: ContextType<typeof SettingsContext>;
  components: ContextType<typeof ComponentsContext>;
}

/**
 * Reads the toolkit's context values so they can be handed to a `ContextBridge`.
 * @internal
 */
export const useBridgedContexts = (): BridgedContexts => ({
  video: useContext(VideoStoreContext),
  progress: useContext(ProgressStoreContext),
  controls: useContext(ControlsControllerContext),
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
  <VideoStoreContext.Provider value={contexts.video}>
    <ProgressStoreContext.Provider value={contexts.progress}>
      <ControlsControllerContext.Provider value={contexts.controls}>
        <ThemeContext.Provider value={contexts.theme}>
          <SettingsContext.Provider value={contexts.settings}>
            <ComponentsContext.Provider value={contexts.components}>{children}</ComponentsContext.Provider>
          </SettingsContext.Provider>
        </ThemeContext.Provider>
      </ControlsControllerContext.Provider>
    </ProgressStoreContext.Provider>
  </VideoStoreContext.Provider>
);
