import { type TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Hides the system bars: Android's status and navigation bars (sticky immersive mode), and the
   * status bar on iOS. The screen orientation is left alone.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  enterFullscreen(): Promise<boolean>;
  /**
   * Shows the system bars again.
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

export const NativeVideoToolkit = TurboModuleRegistry.getEnforcing<Spec>('VideoToolkit');
export default NativeVideoToolkit;
