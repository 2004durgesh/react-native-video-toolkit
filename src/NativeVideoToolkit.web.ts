/// <reference lib="dom" />
import { PLAYER_ID_PREFIX } from './fullscreen/playerId';

export interface Spec {
  /**
   * Enters fullscreen mode.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  enterFullscreen(element?: Element | null): Promise<boolean>;
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
  /**
   * Whether picture-in-picture can work here: the device supports it and the app is set up for it
   * (the `audio` background mode on iOS, `supportsPictureInPicture` on Android, and the user hasn't
   * turned it off for the app). Synchronous, so it can be used while rendering.
   */
  isPictureInPictureSupported(): boolean;
}

export const NativeVideoToolkit: Spec = {
  /**
   * Puts `element`, the player around the caller's own video, in browser fullscreen. Without one, the
   * first player on the page.
   */
  enterFullscreen: async (element?: Element | null): Promise<boolean> => {
    try {
      const videoSurface = element ?? document.querySelector(`[id^="${PLAYER_ID_PREFIX}"]`);
      if (!videoSurface) {
        console.error('No video player element found');
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

  /**
   * Whether the browser supports picture-in-picture for video elements.
   */
  isPictureInPictureSupported: (): boolean => {
    return typeof document !== 'undefined' && !!document.pictureInPictureEnabled;
  },
};

export default NativeVideoToolkit;
