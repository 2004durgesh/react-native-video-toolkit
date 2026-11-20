import type { AudioTrack, VideoTrack } from 'react-native-video';
import type { CaptionTrack } from '../../tracks/types';
import { useSettingsContext } from '../../providers';
import { MenuOpenStateContext } from '../../providers/SettingsProvider';
import { useCallback, useContext } from 'react';
import type { CustomVideoTrack } from '../../types';

/**
 * A hook for managing video settings like video track, audio tracks, text/subtitle tracks, and menu visibility.
 *
 * @returns An object with the following properties:
 * - `videoTrack`: The current video track setting.
 * - `videoTracks`: The list of available video tracks.
 * - `setVideoTrack`: A function to set the current video track.
 * - `setAvailableVideoTracks`: A function to set the list of available video tracks.
 * - `audioTrack`: The current audio track setting.
 * - `audioTracks`: The list of available audio tracks.
 * - `setAudioTrack`: A function to set the current audio track.
 * - `setAvailableAudioTracks`: A function to set the list of available audio tracks.
 * - `textTrack`: The current text/subtitle track setting.
 * - `textTracks`: The list of available text/subtitle tracks.
 * - `setTextTrack`: A function to set the current text track.
 * - `setAvailableTextTracks`: A function to set the list of available text tracks.
 * - `isSettingsMenuVisible`: Whether the settings menu is currently visible.
 * - `openSettings`: A function to open the settings menu.
 * - `closeSettings`: A function to close the settings menu.
 * - `setSettingsMenuVisible`: A function to directly set the settings menu visibility.
 *
 * Inside a `Menu.Root`, the last four act on that menu instead, so the settings button opens the
 * menu around it.
 */
export const useSettings = () => {
  const { state, dispatch } = useSettingsContext();
  const menu = useContext(MenuOpenStateContext);

  const setSettingsMenuVisible = useCallback(
    (visible: boolean) => {
      if (menu) {
        menu.setOpen(visible);
      } else {
        dispatch({ type: visible ? 'OPEN_SETTINGS_SHEET' : 'CLOSE_SETTINGS_SHEET' });
      }
    },
    [menu, dispatch]
  );

  const openSettings = useCallback(() => setSettingsMenuVisible(true), [setSettingsMenuVisible]);

  const closeSettings = useCallback(() => setSettingsMenuVisible(false), [setSettingsMenuVisible]);

  const setVideoTrack = useCallback(
    (newVideoTrack: CustomVideoTrack | VideoTrack | null) => {
      dispatch({ type: 'SET_VIDEO_TRACK', payload: newVideoTrack });
    },
    [dispatch]
  );

  const setAvailableVideoTracks = useCallback(
    (videoTracks: (CustomVideoTrack | VideoTrack)[]) => {
      dispatch({ type: 'SET_AVAILABLE_VIDEO_TRACKS', payload: videoTracks });
    },
    [dispatch]
  );

  const setAudioTrack = useCallback(
    (newAudioTrack: AudioTrack | null) => {
      dispatch({ type: 'SET_AUDIO_TRACK', payload: newAudioTrack });
    },
    [dispatch]
  );

  const setAvailableAudioTracks = useCallback(
    (audioTracks: AudioTrack[]) => {
      dispatch({ type: 'SET_AVAILABLE_AUDIO_TRACKS', payload: audioTracks });
    },
    [dispatch]
  );

  const setAvailableTextTracks = useCallback(
    (textTracks: CaptionTrack[]) => {
      dispatch({ type: 'SET_AVAILABLE_TEXT_TRACKS', payload: textTracks });
    },
    [dispatch]
  );

  const setTextTrack = useCallback(
    (newTextTrack: CaptionTrack | null) => {
      dispatch({ type: 'SET_TEXT_TRACK', payload: newTextTrack });
    },
    [dispatch]
  );

  return {
    videoTrack: state.videoTrack,
    videoTracks: state.videoTracks,
    setVideoTrack,
    setAvailableVideoTracks,
    audioTrack: state.audioTrack,
    audioTracks: state.audioTracks,
    setAudioTrack,
    setAvailableAudioTracks,
    textTrack: state.textTrack,
    textTracks: state.textTracks,
    setTextTrack,
    setAvailableTextTracks,
    isSettingsMenuVisible: menu ? menu.open : state.isSettingsMenuVisible,
    openSettings,
    closeSettings,
    setSettingsMenuVisible,
  };
};
