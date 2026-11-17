import React, { useImperativeHandle, type Ref } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { VideoProvider, useVideo } from '../../providers';
import { VideoPlayer } from '../VideoPlayer';
import { useProgress, useSettings } from '../../hooks';
import type { VideoPlayerConfig } from '../../types';

type Snapshot = {
  video: ReturnType<typeof useVideo>;
  progress: ReturnType<typeof useProgress>;
  settings: ReturnType<typeof useSettings>;
};

const Inspector = ({ handle }: { handle: Ref<Snapshot> }) => {
  const video = useVideo();
  const progress = useProgress();
  const settings = useSettings();
  useImperativeHandle(handle, () => ({ video, progress, settings }));
  return null;
};

const handle = React.createRef<Snapshot>();
const state = () => handle.current!.video.state;

const player = (uri: string, config: Partial<VideoPlayerConfig> = {}, repeat = false) => (
  <GestureHandlerRootView>
    <VideoProvider config={{ autoPlay: false, ...config }}>
      <VideoPlayer source={{ uri }} videoProps={{ repeat }}>
        <Inspector handle={handle} />
      </VideoPlayer>
    </VideoProvider>
  </GestureHandlerRootView>
);

const nativeVideo = () => screen.getByTestId('native-video');
const fire = (event: string, payload: object = {}) => act(() => nativeVideo().props[event]?.(payload));
const load = () =>
  fire('onLoad', {
    duration: 60,
    currentTime: 0,
    naturalSize: { width: 1920, height: 1080, orientation: 'landscape' },
    audioTracks: [{ index: 0, language: 'en' }],
    videoTracks: [],
    textTracks: [],
  });

describe('a new video in the same player', () => {
  it('starts clean when the source changes, though the last one failed partway', async () => {
    const { rerender } = await render(player('https://example.com/a.mp4'));
    await load();
    await fire('onProgress', { currentTime: 30, playableDuration: 40 });
    await fire('onError', { error: { errorString: 'Network lost' } });
    expect(state().error).toBe('Network lost');
    expect(handle.current!.settings.audioTracks).toHaveLength(1);

    await rerender(player('https://example.com/b.mp4'));
    expect(state().error).toBeNull();
    expect(state().duration).toBe(0);
    expect(handle.current!.progress.currentTime).toBe(0);
    expect(handle.current!.settings.audioTracks).toHaveLength(0);
  });

  it('starts clean on onLoadStart, after the last one ended', async () => {
    await render(player('https://example.com/a.mp4'));
    await load();
    await fire('onEnd');
    expect(state().ended).toBe(true);

    await fire('onLoadStart');
    expect(state().ended).toBe(false);
    expect(state().duration).toBe(0);
  });

  it('plays the next video with autoPlay, though the last one ended paused', async () => {
    const { rerender } = await render(player('https://example.com/a.mp4', { autoPlay: true }));
    await load();
    await fire('onEnd');
    expect(state().isPlaying).toBe(false);

    await rerender(player('https://example.com/b.mp4', { autoPlay: true }));
    await load();
    expect(state().isPlaying).toBe(true);
  });
});

describe('player events', () => {
  it("keeps playing with repeat, though the player reports each loop's end", async () => {
    await render(player('https://example.com/a.mp4', { autoPlay: true }, true));
    await load();
    await fire('onEnd');
    expect(state().isPlaying).toBe(true);
    expect(state().ended).toBe(false);
  });

  it('stops buffering on an error, which Android reports without the end of buffering', async () => {
    await render(player('https://example.com/a.mp4'));
    await fire('onBuffer', { isBuffering: true });
    expect(state().buffering).toBe(true);
    await fire('onError', { error: { errorString: 'Decoder failed' } });
    expect(state().buffering).toBe(false);
  });
});
