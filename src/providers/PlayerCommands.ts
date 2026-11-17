import { createContext, useContext } from 'react';
import type { VideoRef } from 'react-native-video';
import { enterPlatformFullscreen, exitPlatformFullscreen } from '../fullscreen/platform';
import { restoreAfterFullscreen, rotateForFullscreen } from '../fullscreen/orientation';
import type { ProgressStore } from './ProgressStore';
import type { ControlsController } from './ControlsController';

interface CommandState {
  isPlaying: boolean;
  muted: boolean;
  duration: number;
  fullscreen: boolean;
  videoRef: { current: VideoRef | null } | null;
  config: { enableScreenRotation: boolean; onEnterFullscreen?: () => void; onExitFullscreen?: () => void };
}

type CommandAction =
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  | { type: 'SET_FULLSCREEN'; payload: boolean };

/** @internal */
interface PlayerCommandsOptions {
  getState: () => CommandState;
  dispatch: (action: CommandAction) => void;
  progress: ProgressStore;
  controls: ControlsController;
}

/**
 * Creates a provider's player commands: everything that acts on playback. Hooks, gestures, the TV
 * remote and the fullscreen exits all go through these, so each action has one implementation.
 * Showing the controls is part of a command where the viewer expects them (mute, fullscreen); the
 * controls controller already shows them when playback starts or stops.
 * @internal
 */
export const createPlayerCommands = ({ getState, dispatch, progress, controls }: PlayerCommandsOptions) => {
  /** An unknown duration (0) doesn't clamp, or every early seek would go to 0. */
  const clampTime = (time: number) => {
    const { duration } = getState();
    return Math.max(0, duration > 0 ? Math.min(time, duration) : time);
  };

  /** Seeks the video and publishes the position. Returns whether there was a video to seek. */
  const seek = (time: number): boolean => {
    const video = getState().videoRef?.current;
    if (!video) return false;
    const target = clampTime(time);
    video.seek(target);
    progress.update({ currentTime: target });
    return true;
  };

  const setPlaying = (playing: boolean) => dispatch({ type: 'SET_PLAYING', payload: playing });
  const setMuted = (muted: boolean) => dispatch({ type: 'SET_MUTED', payload: muted });

  const enterFullscreen = async () => {
    const state = getState();
    if (state.fullscreen) return;
    dispatch({ type: 'SET_FULLSCREEN', payload: true });
    controls.show();
    if (state.config.enableScreenRotation) rotateForFullscreen();
    enterPlatformFullscreen(state.videoRef?.current);
    state.config.onEnterFullscreen?.();
  };

  const exitFullscreen = async () => {
    const state = getState();
    if (!state.fullscreen) return;
    dispatch({ type: 'SET_FULLSCREEN', payload: false });
    if (state.config.enableScreenRotation) restoreAfterFullscreen();
    exitPlatformFullscreen();
    state.config.onExitFullscreen?.();
    controls.show();
  };

  return {
    clampTime,
    seek,
    /** Seeks by `seconds` from the published position, so quick repeats add up. */
    seekBy: (seconds: number) => seek(progress.getSnapshot().currentTime + seconds),
    setPlaying,
    togglePlay: () => setPlaying(!getState().isPlaying),
    setVolume: (volume: number) => dispatch({ type: 'SET_VOLUME', payload: volume }),
    setMuted,
    toggleMute: () => {
      setMuted(!getState().muted);
      controls.show();
    },
    setRate: (rate: number) => dispatch({ type: 'SET_PLAYBACK_RATE', payload: rate }),
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen: () => (getState().fullscreen ? exitFullscreen() : enterFullscreen()),
  };
};

/** @internal */
export type PlayerCommands = ReturnType<typeof createPlayerCommands>;

/** @internal */
export const PlayerCommandsContext = createContext<PlayerCommands | undefined>(undefined);

/** @internal */
export const usePlayerCommands = (): PlayerCommands => {
  const commands = useContext(PlayerCommandsContext);
  if (commands === undefined) throw new Error('This hook must be used within a VideoProvider');
  return commands;
};
