import type { AudioTrack, TextTrack, VideoTrack } from 'react-native-video';
import { useSettingsContext } from '../../providers';
import { useCallback } from 'react';

/**
 * A hook for managing video settings like video track, audio tracks, and text/subtitle tracks.
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
   * Sets the available video tracks list.
   * @param videoTracks - An array of available video tracks.
   */
  const setAvailableVideoTracks = useCallback(
    (videoTracks: VideoTrack[]) => {
      dispatch({ type: 'SET_AVAILABLE_VIDEO_TRACKS', payload: videoTracks });
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
   * Sets the available audio tracks list.
   * @param audioTracks - An array of available audio tracks.
   */
  const setAvailableAudioTracks = useCallback(
    (audioTracks: AudioTrack[]) => {
      dispatch({ type: 'SET_AVAILABLE_AUDIO_TRACKS', payload: audioTracks });
    },
    [dispatch]
  );

  /**
   * Sets the available text/subtitle tracks list.
   * @param textTracks - An array of available text tracks.
   */
  const setAvailableTextTracks = useCallback(
    (textTracks: TextTrack[]) => {
      dispatch({ type: 'SET_AVAILABLE_TEXT_TRACKS', payload: textTracks });
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
    setAvailableVideoTracks,
    audioTrack: state.audioTrack,
    audioTracks: state.audioTracks,
    setAudioTrack,
    setAvailableAudioTracks,
    textTrack: state.textTrack,
    textTracks: state.textTracks,
    setTextTrack,
    setAvailableTextTracks,
    isSettingsMenuVisible: state.isSettingsMenuVisible,
    openSettings,
    closeSettings,
    toggleSettingsMenu,
  };
};
