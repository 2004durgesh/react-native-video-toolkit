/// <reference lib="dom" />
/**
 * @file NativeVideoToolkit.web.ts
 * @description This file provides a web implementation of the NativeVideoToolkit module.
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
   * Enters fullscreen mode on the web.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  enterFullscreen: async (): Promise<boolean> => {
    try {
      if (document.documentElement.requestFullscreen) {
        console.log('Entering fullscreen mode');
        await document.documentElement.requestFullscreen();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to enter fullscreen:', error);
      return false;
    }
  },
  /**
   * Exits fullscreen mode on the web.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  exitFullscreen: async (): Promise<boolean> => {
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to exit fullscreen:', error);
      return false;
    }
  },
  /**
   * Checks if the application is currently in fullscreen mode on the web.
   * @returns A promise that resolves to a boolean indicating whether the application is in fullscreen mode.
   */
  isFullscreen: async (): Promise<boolean> => {
    return document.fullscreenElement !== null;
  },
};

export default NativeVideoToolkit;
