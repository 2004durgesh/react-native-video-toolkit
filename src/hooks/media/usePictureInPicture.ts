import { useCallback, useMemo } from 'react';
import { useVideo } from '../../providers';
import { isPictureInPictureSupported } from '../../utils/pictureInPicture';

/**
 * Return type for the usePictureInPicture hook.
 */
export interface UsePictureInPictureReturn {
  /** Whether the video is playing in picture-in-picture. */
  pictureInPicture: boolean;
  /** Whether picture-in-picture can work on this device and in this app (see `isPictureInPictureSupported`). */
  supported: boolean;
  /** Moves the video into a floating picture-in-picture window. */
  enterPictureInPicture: () => void;
  /** Brings the video back from picture-in-picture. */
  exitPictureInPicture: () => void;
  /** Enters or exits picture-in-picture. */
  togglePictureInPicture: () => void;
}

/**
 * A hook for controlling picture-in-picture.
 *
 * Picture-in-picture needs native setup: the `audio` background mode on iOS, and
 * `android:supportsPictureInPicture` on the Android activity (the react-native-video Expo plugin
 * adds both with `enableBackgroundAudio` and `enableAndroidPictureInPicture`). On Android,
 * react-native-video shows only the video in the picture-in-picture window and restores the screen
 * afterwards. Keep the player mounted while `pictureInPicture` is `true`: remounting it there
 * loses the picture-in-picture session.
 *
 * @returns An object with the following properties:
 * - `pictureInPicture`: Whether the video is playing in picture-in-picture.
 * - `supported`: Whether picture-in-picture can work on this device and in this app.
 * - `enterPictureInPicture`: A function to enter picture-in-picture.
 * - `exitPictureInPicture`: A function to exit picture-in-picture.
 * - `togglePictureInPicture`: A function to toggle picture-in-picture.
 */
export const usePictureInPicture = (): UsePictureInPictureReturn => {
  const { state } = useVideo();
  const { videoRef, pictureInPicture } = state;
  const supported = useMemo(isPictureInPictureSupported, []);

  // The state follows react-native-video's `onPictureInPictureStatusChanged`, so these only ask.
  const enterPictureInPicture = useCallback(() => {
    videoRef?.current?.enterPictureInPicture();
  }, [videoRef]);

  const exitPictureInPicture = useCallback(() => {
    videoRef?.current?.exitPictureInPicture();
  }, [videoRef]);

  const togglePictureInPicture = useCallback(() => {
    if (pictureInPicture) {
      exitPictureInPicture();
    } else {
      enterPictureInPicture();
    }
  }, [pictureInPicture, enterPictureInPicture, exitPictureInPicture]);

  return {
    pictureInPicture,
    supported,
    enterPictureInPicture,
    exitPictureInPicture,
    togglePictureInPicture,
  };
};
