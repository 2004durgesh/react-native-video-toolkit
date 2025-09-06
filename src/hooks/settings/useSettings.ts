import type { AudioTrack, TextTrack, VideoTrack } from 'react-native-video';
import { useSettingsContext } from '../../providers';
import { useCallback } from 'react';

/**
 * A hook for managing video settings like videoTrack, audio tracks, and texts.
 *
 * @returns An object with the following properties:
 * - `videoTrack`: The current video videoTrack setting.
 * - `setVideoTrack`: A function to set the video videoTrack.
 * - `audioTrack`: The current audio track setting.
 * - `setAudioTrack`: A function to set the audio track.
 * - `textTrack`: The current text track setting.
 * - `setTextTrack`: A function to set the text track.
 */
export const useSettings = () => {
  const { state, dispatch } = useSettingsContext();

  const openSettings = useCallback(() => {
    dispatch({ type: 'OPEN_SETTINGS_SHEET' });
  }, [dispatch]);

  const closeSettings = useCallback(() => {
    dispatch({ type: 'CLOSE_SETTINGS_SHEET' });
  }, [dispatch]);
  const toggleSettingsMenu = useCallback(() => {
    dispatch({ type: 'TOGGLE_SETTINGS_MENU' });
    const newSettingsMenuState = !state.isSettingsMenuVisible;

    if (newSettingsMenuState) {
      openSettings();
    } else {
      closeSettings();
    }
  }, [dispatch, state.isSettingsMenuVisible, openSettings, closeSettings]);

  /**
   * Sets the video videoTrack.
   * @param newVideoTrack - The new video videoTrack (e.g., 'auto', '1080p', '720p').
   */
  const setVideoTrack = useCallback(
    (newVideoTrack: VideoTrack | null) => {
      dispatch({ type: 'SET_VIDEO_TRACK', payload: newVideoTrack });
    },
    [dispatch]
  );

  /**
   * Gets the available video videoTracks.
   * @param videoTracks - An array of available video videoTracks.
   */

  const getVideoTracks = useCallback(
    (videoTracks: VideoTrack[]) => {
      dispatch({ type: 'GET_VIDEO_TRACKS', payload: videoTracks });
    },
    [dispatch]
  );

  /**
   * Sets the audio track.
   * @param newAudioTrack - The new audio track (e.g., 'english', 'spanish').
   */
  const setAudioTrack = useCallback(
    (newAudioTrack: AudioTrack | null) => {
      dispatch({ type: 'SET_AUDIO_TRACK', payload: newAudioTrack });
    },
    [dispatch]
  );

  /**
   * Gets the available audio tracks.
   * @param audioTracks - An array of available audio tracks.
   */

  const getAudioTracks = useCallback(
    (audioTracks: AudioTrack[]) => {
      dispatch({ type: 'GET_AUDIO_TRACKS', payload: audioTracks });
    },
    [dispatch]
  );

  /**
   * Gets the available text tracks.
   * @param textTracks - An array of available text tracks.
   */

  const getTextTracks = useCallback(
    (textTracks: TextTrack[]) => {
      dispatch({ type: 'GET_TEXT_TRACKS', payload: textTracks });
    },
    [dispatch]
  );

  /**
   * Sets the text track.
   * @param newTextTrack - The new text track (e.g., 'off', 'english', 'french').
   */
  const setTextTrack = useCallback(
    (newTextTrack: TextTrack | null) => {
      dispatch({ type: 'SET_TEXT_TRACK', payload: newTextTrack });
    },
    [dispatch]
  );

  return {
    videoTrack: state.videoTrack,
    videoTracks: state.videoTracks,
    setVideoTrack,
    getVideoTracks,
    audioTrack: state.audioTrack,
    audioTracks: state.audioTracks,
    setAudioTrack,
    getAudioTracks,
    textTrack: state.textTrack,
    textTracks: state.textTracks,
    setTextTrack,
    getTextTracks,
    isSettingsMenuVisible: state.isSettingsMenuVisible,
    openSettings,
    closeSettings,
    toggleSettingsMenu,
  };
};
