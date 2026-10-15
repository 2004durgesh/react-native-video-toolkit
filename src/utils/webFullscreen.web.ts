/// <reference lib="dom" />
import type { VideoRef } from 'react-native-video';
import { NativeVideoToolkit } from '../NativeVideoToolkit.web';

/**
 * Puts the player around this video in browser fullscreen. A page can have several players, so it
 * finds this one from its video; each player's id starts with `video-player`.
 * @internal
 */
export const requestPlayerFullscreen = (video: VideoRef | null | undefined): void => {
  const player = video?.nativeHtmlVideoRef?.current?.closest('[id^="video-player"]') ?? null;
  NativeVideoToolkit.enterFullscreen(player);
};

/**
 * Calls `onExit` when the browser leaves fullscreen by itself: Esc, or its own controls.
 * @returns A function that stops listening.
 * @internal
 */
export const onBrowserFullscreenExit = (onExit: () => void): (() => void) => {
  if (typeof document === 'undefined') return () => {};
  const onChange = () => {
    if (!document.fullscreenElement) onExit();
  };
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
};
