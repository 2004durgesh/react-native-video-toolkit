import type { VideoRef } from 'react-native-video';

// The browser's own fullscreen, which only the web has: `webFullscreen.web.ts` does the work. The
// DOM stays in that file, so native builds and the type checks of native apps don't need it.

/**
 * Puts the player around this video in browser fullscreen. Nothing off the web.
 * @internal
 */
export const requestPlayerFullscreen = (_video: VideoRef | null | undefined): void => {};

/**
 * Calls `onExit` when the browser leaves fullscreen by itself, for example on Esc. Nothing off the web.
 * @returns A function that stops listening.
 * @internal
 */
export const onBrowserFullscreenExit =
  (_onExit: () => void): (() => void) =>
  () => {};
