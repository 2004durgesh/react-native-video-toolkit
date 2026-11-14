import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TextTrackType } from 'react-native-video';
import { VideoProvider } from '../../providers/VideoProvider';
import { VideoPlayer } from '../../components/VideoPlayer';
import { clearCaptionCache } from '../load';
import type { VideoPlayerConfig } from '../../types';

// The native video view, as a plain component whose props the tests read
jest.mock('react-native-video', () => {
  const actual = jest.requireActual('react-native-video');
  const { View } = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react');
  const MockVideo = ReactActual.forwardRef((props: object, ref: unknown) => {
    ReactActual.useImperativeHandle(ref, () => ({ seek: jest.fn() }));
    return ReactActual.createElement(View, { ...props, testID: 'native-video' });
  });
  return { __esModule: true, ...actual, default: MockVideo };
});

const VTT = 'WEBVTT\n\n00:00.000 --> 00:10.000\nHello';
const NEXT_VTT = 'WEBVTT\n\n00:00.000 --> 00:10.000\nNext episode';

const source = {
  uri: 'https://example.com/movie.mp4',
  textTracks: [
    { title: 'English', language: 'en' as const, type: TextTrackType.VTT, uri: 'https://example.com/en.vtt' },
    { title: 'Français', language: 'fr' as const, type: TextTrackType.SUBRIP, uri: 'https://example.com/fr.srt' },
  ],
};

const nativeVideo = () => screen.getByTestId('native-video');

const player = (config: Partial<VideoPlayerConfig>, playing: typeof source) => (
  <GestureHandlerRootView>
    <VideoProvider config={{ autoPlay: false, ...config }}>
      <VideoPlayer source={playing} />
    </VideoProvider>
  </GestureHandlerRootView>
);

const renderPlayer = (config: Partial<VideoPlayerConfig> = {}) => render(player(config, source));

const loadVideo = async (textTracks: { index: number; language?: string; title?: string }[] = []) => {
  await act(() =>
    fireEvent(screen.getByTestId('video-captions'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 640, height: 360 } },
    })
  );
  await act(() => nativeVideo().props.onLoadStart?.({}));
  await act(() =>
    nativeVideo().props.onLoad?.({
      duration: 60,
      currentTime: 0,
      naturalSize: { width: 1920, height: 1080, orientation: 'landscape' },
      audioTracks: [],
      videoTracks: [],
      textTracks,
    })
  );
};

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
};

beforeEach(() => {
  clearCaptionCache();
  global.fetch = jest.fn(async (url: string) => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => new TextEncoder().encode(url.includes('next') ? NEXT_VTT : VTT).buffer,
  })) as unknown as typeof fetch;
});

describe('VideoSurface with the custom renderer', () => {
  it('never gives the player the subtitle files, and keeps native subtitles off (SUB-TRACK-01)', async () => {
    await renderPlayer();
    await loadVideo();
    expect(nativeVideo().props.source).toEqual({ uri: 'https://example.com/movie.mp4' });
    expect(nativeVideo().props.textTracks).toBeUndefined();
    expect(nativeVideo().props.selectedTextTrack).toEqual({ type: 'disabled' });
  });

  it('draws the selected subtitle file itself', async () => {
    await renderPlayer();
    await loadVideo();
    await flush();
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/en.vtt', expect.anything());
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('Hello');
  });

  it('selects an embedded track natively, next to the files', async () => {
    await renderPlayer();
    // The English file is picked first; an embedded track can still be drawn natively
    await loadVideo([{ index: 0, language: 'de', title: 'Deutsch' }]);
    expect(nativeVideo().props.selectedTextTrack).toEqual({ type: 'disabled' });
  });

  it('never shows the subtitles of the previous video after a switch to the next one', async () => {
    const { rerender } = await renderPlayer();
    await loadVideo();
    await flush();
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('Hello');
    const next = {
      uri: 'https://example.com/next.mp4',
      textTracks: [{ ...source.textTracks[0]!, uri: 'https://example.com/next.en.vtt' }],
    };
    // The next file arrives only when released
    const fetchMock = global.fetch as jest.Mock;
    const respond = fetchMock.getMockImplementation()!;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.includes('next')) await gate;
      return respond(url, init);
    });
    await rerender(player({}, next));
    // Gone at once, before the next file loads
    expect(screen.queryByTestId('video-captions-cue-0')).toBeNull();
    release();
    await flush();
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('Next episode');
    // The previous video's file isn't loaded again on the way
    const fetched = (global.fetch as jest.Mock).mock.calls.map(([url]) => url);
    expect(fetched).toEqual(['https://example.com/en.vtt', 'https://example.com/next.en.vtt']);
  });

  it('keeps the same subtitle file across videos without fetching it again', async () => {
    const { rerender } = await renderPlayer();
    await loadVideo();
    await flush();
    await rerender(player({}, { ...source, uri: 'https://example.com/movie-720p.mp4' }));
    await flush();
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('Hello');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('uses the progress interval from the config (SUB-TIME-03)', async () => {
    await renderPlayer();
    expect(nativeVideo().props.progressUpdateInterval).toBe(250);
  });
});

describe('VideoSurface with the native renderer', () => {
  it('passes subtitle files to the player as before', async () => {
    await renderPlayer({ captionRenderer: 'native' });
    expect(nativeVideo().props.source).toEqual(source);
    expect(screen.queryByTestId('video-captions')).toBeNull();
  });
});
