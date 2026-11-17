/// <reference lib="dom" />
import type { VideoRef } from 'react-native-video';
import { NativeVideoToolkit } from '../NativeVideoToolkit.web';
import { PLAYER_ID_PREFIX } from './playerId';

/**
 * Puts the player around this video in browser fullscreen. A page can have several players, so it
 * finds this one from its own video.
 * @internal
 */
export const enterPlatformFullscreen = (video: VideoRef | null | undefined): Promise<boolean> => {
  const player = video?.nativeHtmlVideoRef?.current?.closest(`[id^="${PLAYER_ID_PREFIX}"]`) ?? null;
  return NativeVideoToolkit.enterFullscreen(player);
};

/** @internal */
export const exitPlatformFullscreen = (): Promise<boolean> => NativeVideoToolkit.exitFullscreen();

/**
 * Calls `onExit` when the browser leaves fullscreen by itself: Esc, or its own controls.
 * @returns A function that stops listening.
 * @internal
 */
export const onPlatformFullscreenExit = (onExit: () => void): (() => void) => {
  if (typeof document === 'undefined') return () => {};
  const onChange = () => {
    if (!document.fullscreenElement) onExit();
  };
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
};
