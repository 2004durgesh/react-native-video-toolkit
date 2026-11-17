import NativeVideoToolkit from '../NativeVideoToolkit';
import { PlatformUtils } from './platform';

/**
 * Whether picture-in-picture can work here: the device supports it and the app is set up for it
 * (the `audio` background mode on iOS, `android:supportsPictureInPicture` on Android, and the user
 * hasn't turned it off for the app; on web, whether the browser supports it).
 *
 * Returns `true` if the installed native code predates this check, so the picture-in-picture
 * button keeps showing until the app is rebuilt.
 *
 * @returns {boolean} Whether picture-in-picture is supported.
 */
export const isPictureInPictureSupported = (): boolean => {
  // TVs have no picture-in-picture
  if (PlatformUtils.isTV()) return false;
  try {
    return typeof NativeVideoToolkit.isPictureInPictureSupported === 'function'
      ? NativeVideoToolkit.isPictureInPictureSupported()
      : true;
  } catch {
    return true;
  }
};
