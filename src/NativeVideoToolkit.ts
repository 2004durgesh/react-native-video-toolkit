/**
 * @file NativeVideoToolkit.ts
 * @description This file defines the interface and implementation for the NativeVideoToolkit module,
 * which provides methods to manage fullscreen mode in a React Native application.
 * It uses React Native's TurboModule system to interact with native code.
 * The module includes methods to enter and exit fullscreen mode, as well as to check if the
 * application is currently in fullscreen mode.
 */

import { type TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
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
  /**
   * Whether picture-in-picture can work here: the device supports it and the app is set up for it
   * (the `audio` background mode on iOS, `supportsPictureInPicture` on Android, and the user hasn't
   * turned it off for the app). Synchronous, so it can be used while rendering.
   */
  isPictureInPictureSupported(): boolean;
}

export const NativeVideoToolkit = TurboModuleRegistry.getEnforcing<Spec>('VideoToolkit');
export default NativeVideoToolkit;
