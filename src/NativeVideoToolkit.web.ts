/// <reference lib="dom" />
import { PLAYER_ID_PREFIX } from './fullscreen/playerId';

export interface Spec {
  /**
   * Puts `element`, the player around the caller's own video, in browser fullscreen. Without one, the
   * first player on the page.
   *
   * @returns Whether the browser went fullscreen.
   */
  enterFullscreen(element?: Element | null): Promise<boolean>;
  /**
   * Leaves browser fullscreen, if the page is in it.
   *
   * @returns `false` when the browser can't leave it.
   */
  exitFullscreen(): Promise<boolean>;
  isFullscreen(): Promise<boolean>;
  /**
   * Whether the browser supports picture-in-picture for video elements
   * (`document.pictureInPictureEnabled`). Synchronous, so it can be used while rendering.
   */
  isPictureInPictureSupported(): boolean;
}

export const NativeVideoToolkit: Spec = {
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

  isPictureInPictureSupported: (): boolean => {
    return typeof document !== 'undefined' && !!document.pictureInPictureEnabled;
  },
};

export default NativeVideoToolkit;
