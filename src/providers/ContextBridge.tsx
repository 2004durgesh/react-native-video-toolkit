import React, { useContext, type Context } from 'react';
import { VideoStoreContext } from './VideoProvider';
import { SettingsContext } from './SettingsProvider';
import { ComponentsContext } from './ComponentsProvider';
import { ProgressStoreContext } from './ProgressStore';
import { ControlsControllerContext } from './ControlsController';
import { PlayerCommandsContext } from './PlayerCommands';
import { CaptionsControllerContext } from '../captions/CaptionsController';
import { ControlsFocusableContext, TVFocusContext } from '../tv/TVFocus';
import { TestIDContext } from '../utils/testIDs';

/**
 * Every context the toolkit's components read. Sheets can render through a portal outside the
 * providers, so the menu re-provides all of these around its content: a context added to the
 * toolkit goes in this list.
 */
const BRIDGED: Context<any>[] = [
  VideoStoreContext,
  ProgressStoreContext,
  ControlsControllerContext,
  PlayerCommandsContext,
  CaptionsControllerContext,
  SettingsContext,
  ComponentsContext,
  TestIDContext,
  TVFocusContext,
  ControlsFocusableContext,
];

/**
 * Snapshot of the toolkit's context values, in `BRIDGED`'s order.
 * @internal
 */
export type BridgedContexts = unknown[];

/**
 * Reads the toolkit's context values so they can be handed to a `ContextBridge`.
 * @internal
 */
export const useBridgedContexts = (): BridgedContexts => {
  const values: unknown[] = [];
  // eslint-disable-next-line react-hooks/rules-of-hooks -- BRIDGED never changes, so the hooks run in the same order every render
  for (const context of BRIDGED) values.push(useContext(context));
  return values;
};

/**
 * Re-provides the toolkit's contexts around `children`. Custom sheets often render through their
 * own portal (for example `@gorhom/bottom-sheet`'s `BottomSheetModalProvider`), which can sit outside
 * `VideoProvider`; wrapped in this, the menu content keeps working wherever it ends up.
 * @internal
 */
export const ContextBridge: React.FC<{ contexts: BridgedContexts; children: React.ReactNode }> = ({
  contexts,
  children,
}) =>
  BRIDGED.reduceRight<React.ReactNode>(
    (inner, BridgedContext, i) => <BridgedContext.Provider value={contexts[i]}>{inner}</BridgedContext.Provider>,
    children
  ) as React.ReactElement;
