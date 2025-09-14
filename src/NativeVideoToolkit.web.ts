/// <reference lib="dom" />
/**
 * @file NativeVideoToolkit.web.ts
 * @description This file provides a web implementation of the NativeVideoToolkit module.
 * For web, we use CSS-based fullscreen instead of browser fullscreen API to maintain
 * React Native Web compatibility and avoid black screen issues.
 */

export interface Spec {
  /**
   * Enters fullscreen mode.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  enterFullscreen(): Promise<boolean>;
  /**
   * Exits fullscreen mode.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  exitFullscreen(): Promise<boolean>;
  /**
   * Checks if the application is currently in fullscreen mode.
   * @returns A promise that resolves to a boolean indicating whether the application is in fullscreen mode.
   */
  isFullscreen(): Promise<boolean>;
}

export const NativeVideoToolkit: Spec = {
  /**
   * Request fullscreen on the #video-player element.
   */
  enterFullscreen: async (): Promise<boolean> => {
    try {
      const videoSurface = document.getElementById('video-player');
      if (!videoSurface) {
        console.error("No element found with id 'video-player'");
        return false;
      }

      if (videoSurface.requestFullscreen) {
        await videoSurface.requestFullscreen();
      } else if ((videoSurface as any).webkitRequestFullscreen) {
        await (videoSurface as any).webkitRequestFullscreen();
      } else if ((videoSurface as any).msRequestFullscreen) {
        await (videoSurface as any).msRequestFullscreen();
      } else {
        console.warn('Fullscreen API is not supported in this browser.');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error entering fullscreen:', err);
      return false;
    }
  },

  /**
   * Exit fullscreen mode if active.
   */
  exitFullscreen: async (): Promise<boolean> => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        } else {
          console.warn('Fullscreen exit API not supported in this browser.');
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Error exiting fullscreen:', err);
      return false;
    }
  },

  /**
   * Check if currently in fullscreen mode.
   */
  isFullscreen: async (): Promise<boolean> => {
    try {
      return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
    } catch (err) {
      console.error('Error checking fullscreen state:', err);
      return false;
    }
  },
};

export default NativeVideoToolkit;
