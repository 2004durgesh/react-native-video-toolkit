import React, { useImperativeHandle, type Ref } from 'react';
import { BackHandler, Dimensions, Platform } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';
import { NativeVideoToolkit } from '../../NativeVideoToolkit';
import { VideoProvider, useVideo } from '../index';
import { VideoPlayer } from '../../components/VideoPlayer';
import { useFullscreen, usePlayback, usePlaybackRate, useProgress, useVolume } from '../../hooks';
import type { VideoPlayerConfig } from '../../types';

type Handle = {
  video: ReturnType<typeof useVideo>;
  playback: ReturnType<typeof usePlayback>;
  progress: ReturnType<typeof useProgress>;
  volume: ReturnType<typeof useVolume>;
  rate: ReturnType<typeof usePlaybackRate>;
  fullscreen: ReturnType<typeof useFullscreen>;
};

const Inspector = ({ handle }: { handle: Ref<Handle> }) => {
  const video = useVideo();
  const playback = usePlayback();
  const progress = useProgress();
  const volume = useVolume();
  const rate = usePlaybackRate();
  const fullscreen = useFullscreen();
  useImperativeHandle(handle, () => ({ video, playback, progress, volume, rate, fullscreen }));
  return null;
};

const setUp = async (config: Partial<VideoPlayerConfig> = {}) => {
  const handle = React.createRef<Handle>();
  await render(
    <GestureHandlerRootView>
      <VideoProvider config={{ autoPlay: false, ...config }}>
        <VideoPlayer source={{ uri: 'https://example.com/movie.mp4' }}>
          <Inspector handle={handle} />
        </VideoPlayer>
      </VideoProvider>
    </GestureHandlerRootView>
  );
  const state = () => handle.current!.video.state;
  const seekSpy = () => state().videoRef!.current!.seek as jest.Mock;
  return { handle, state, seekSpy };
};

const setWindow = (width: number, height: number) => {
  const window = { width, height, scale: 2, fontScale: 1 };
  Dimensions.set({ window, screen: window });
};

beforeEach(() => {
  jest.clearAllMocks();
  setWindow(390, 844);
});

describe('playback', () => {
  it('toggles play and pause, and shows the controls', async () => {
    const { handle, state } = await setUp();
    await act(() => handle.current!.video.dispatch({ type: 'SET_CONTROLS_VISIBLE', payload: false }));
    await act(() => handle.current!.playback.togglePlayPause());
    expect(state()).toMatchObject({ isPlaying: true, controlsVisible: true });
    await act(() => handle.current!.playback.togglePlayPause());
    expect(state().isPlaying).toBe(false);
  });

  it('plays again from the end, clearing ended', async () => {
    const { handle, state } = await setUp();
    await act(() => handle.current!.video.dispatch({ type: 'SET_ENDED', payload: true }));
    await act(() => handle.current!.playback.togglePlayPause());
    expect(state()).toMatchObject({ isPlaying: true, ended: false });
  });
});

describe('seek', () => {
  it('seeks the video within its duration and publishes the position', async () => {
    const { handle, seekSpy } = await setUp();
    await act(() => handle.current!.video.dispatch({ type: 'SET_DURATION', payload: 60 }));
    await act(() => handle.current!.progress.seek(30));
    expect(seekSpy()).toHaveBeenLastCalledWith(30);
    expect(handle.current!.progress.currentTime).toBe(30);
    await act(() => handle.current!.progress.seek(100));
    expect(seekSpy()).toHaveBeenLastCalledWith(60);
    await act(() => handle.current!.progress.seek(-5));
    expect(seekSpy()).toHaveBeenLastCalledWith(0);
  });

  it('does not clamp while the duration is unknown', async () => {
    const { handle, seekSpy } = await setUp();
    await act(() => handle.current!.progress.seek(100));
    expect(seekSpy()).toHaveBeenLastCalledWith(100);
  });
});

describe('volume and rate', () => {
  it('keeps the volume between 0 and 1, and toggles mute with the controls up', async () => {
    const { handle, state } = await setUp();
    await act(() => handle.current!.volume.setVolume(2));
    expect(state().volume).toBe(1);
    await act(() => handle.current!.volume.setVolume(-1));
    expect(state().volume).toBe(0);
    await act(() => handle.current!.video.dispatch({ type: 'SET_CONTROLS_VISIBLE', payload: false }));
    await act(() => handle.current!.volume.toggleMute());
    expect(state()).toMatchObject({ muted: true, controlsVisible: true });
  });

  it('sets the playback rate', async () => {
    const { handle, state } = await setUp();
    await act(() => handle.current!.rate.setPlaybackRate(1.5));
    expect(state().playbackRate).toBe(1.5);
  });
});

describe('fullscreen', () => {
  it('turns a phone to landscape and back to portrait', async () => {
    const onEnterFullscreen = jest.fn();
    const onExitFullscreen = jest.fn();
    const { handle, state } = await setUp({ onEnterFullscreen, onExitFullscreen });
    await act(() => handle.current!.fullscreen.enterFullscreen());
    expect(state().fullscreen).toBe(true);
    expect(RNOrientationDirector.lockTo).toHaveBeenLastCalledWith(Orientation.landscape);
    expect(NativeVideoToolkit.enterFullscreen).toHaveBeenCalled();
    expect(onEnterFullscreen).toHaveBeenCalledTimes(1);

    await act(() => handle.current!.video.dispatch({ type: 'SET_CONTROLS_VISIBLE', payload: false }));
    await act(() => handle.current!.fullscreen.exitFullscreen());
    expect(state()).toMatchObject({ fullscreen: false, controlsVisible: true });
    expect(RNOrientationDirector.lockTo).toHaveBeenLastCalledWith(Orientation.portrait);
    expect(NativeVideoToolkit.exitFullscreen).toHaveBeenCalled();
    expect(onExitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('lets a tablet rotate freely again after fullscreen', async () => {
    setWindow(820, 1180);
    const { handle } = await setUp();
    await act(() => handle.current!.fullscreen.enterFullscreen());
    await act(() => handle.current!.fullscreen.exitFullscreen());
    expect(RNOrientationDirector.unlock).toHaveBeenCalled();
  });

  it('leaves the orientation alone without screen rotation', async () => {
    const { handle, state } = await setUp({ enableScreenRotation: false });
    await act(() => handle.current!.fullscreen.toggleFullscreen());
    expect(state().fullscreen).toBe(true);
    await act(() => handle.current!.fullscreen.toggleFullscreen());
    expect(state().fullscreen).toBe(false);
    expect(RNOrientationDirector.lockTo).not.toHaveBeenCalled();
  });

  it("leaves fullscreen on Android's back button, and lets back through otherwise", async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const listeners: ((...args: never[]) => boolean | null | undefined)[] = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, listener) => {
      listeners.push(listener);
      return { remove: () => listeners.splice(listeners.indexOf(listener), 1) };
    });
    const { handle, state } = await setUp();
    expect(listeners).toHaveLength(0);
    await act(() => handle.current!.fullscreen.enterFullscreen());
    expect(listeners.length).toBeGreaterThan(0);
    let handled: boolean | null | undefined;
    await act(async () => {
      handled = (listeners[listeners.length - 1] as () => boolean)();
    });
    expect(handled).toBe(true);
    expect(state().fullscreen).toBe(false);
    expect(listeners).toHaveLength(0);
  });
});
