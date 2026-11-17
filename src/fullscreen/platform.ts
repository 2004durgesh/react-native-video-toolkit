import type { VideoRef } from 'react-native-video';
import { NativeVideoToolkit } from '../NativeVideoToolkit';

// The native side of fullscreen. `platform.web.ts` is the browser's; the DOM stays there, so native
// builds and native apps' type checks don't need it.

/**
 * Enters the platform's fullscreen for this video: on native, hides the system bars.
 * @internal
 */
export const enterPlatformFullscreen = (_video: VideoRef | null | undefined): Promise<boolean> =>
  NativeVideoToolkit.enterFullscreen();

/** @internal */
export const exitPlatformFullscreen = (): Promise<boolean> => NativeVideoToolkit.exitFullscreen();

/**
 * Calls `onExit` when the platform leaves fullscreen by itself. Only the browser does (Esc).
 * @returns A function that stops listening.
 * @internal
 */
export const onPlatformFullscreenExit =
  (_onExit: () => void): (() => void) =>
  () => {};
