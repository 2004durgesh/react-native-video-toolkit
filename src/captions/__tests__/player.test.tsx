import React, { useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TextTrackType } from 'react-native-video';
import { VideoProvider } from '../../providers/VideoProvider';
import { VideoPlayer } from '../../components/VideoPlayer';
import { DefaultLayout } from '../../layouts/DefaultLayout';
import { useControlsVisibility, useSettings } from '../../hooks';
import { clearCaptionCache } from '../load';
import type { VideoPlayerConfig } from '../../types';

// Subtitles through the whole player: `react-native-video` is the mock from jest.setup.ts.

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

const settingsRef = React.createRef<ReturnType<typeof useSettings>>();
/** The player's track settings, for the test to read and change. */
const settings = () => settingsRef.current!;
const Settings = () => {
  const value = useSettings();
  useImperativeHandle(settingsRef, () => value);
  return null;
};

const controls = React.createRef<ReturnType<typeof useControlsVisibility>>();
const Controls = () => {
  const value = useControlsVisibility();
  useImperativeHandle(controls, () => value);
  return null;
};

const player = (config: Partial<VideoPlayerConfig>, playing: object, children?: React.ReactNode) => (
  <GestureHandlerRootView>
    <VideoProvider config={{ autoPlay: false, ...config }}>
      <VideoPlayer source={playing}>
        <Settings />
        {children}
      </VideoPlayer>
    </VideoProvider>
  </GestureHandlerRootView>
);

const renderPlayer = (config: Partial<VideoPlayerConfig> = {}) => render(player(config, source));

/** The player loads the video; `playing` also has it report its first position, as it does once it plays. */
const loadVideo = async (
  textTracks: { index: number; language?: string; title?: string }[] = [],
  { playing = true }: { playing?: boolean } = {}
) => {
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
  if (playing) await reportProgress(0.5);
};

const reportProgress = async (currentTime: number) => {
  await act(() => nativeVideo().props.onProgress?.({ currentTime, playableDuration: 10, seekableDuration: 60 }));
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

describe('subtitles drawn by the toolkit', () => {
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

  it('lets the player draw an embedded track the viewer picks, next to the files', async () => {
    await renderPlayer();
    await loadVideo([{ index: 0, language: 'de', title: 'Deutsch' }]);
    await flush();
    // The English file is picked first
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('Hello');
    await act(() => settings().setTextTrack(settings().textTracks.find((track) => track.language === 'de')!));
    expect(nativeVideo().props.selectedTextTrack).toEqual({ type: 'index', value: 0 });
    expect(screen.queryByTestId('video-captions-cue-0')).toBeNull();
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
    // Loaded, but the next video hasn't started: nothing over its loading screen
    expect(screen.queryByTestId('video-captions-cue-0')).toBeNull();
    await reportProgress(0.5);
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
    await reportProgress(0.5);
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('Hello');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('shows no cue over a video that has loaded but not started', async () => {
    await renderPlayer();
    await loadVideo([], { playing: false });
    await flush();
    expect(screen.queryByTestId('video-captions-cue-0')).toBeNull();
    await reportProgress(0.2);
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('Hello');
  });

  it('hides the cues from onLoadStart until the player reports again', async () => {
    await renderPlayer();
    await loadVideo();
    await flush();
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('Hello');
    await act(() => nativeVideo().props.onLoadStart?.({}));
    expect(screen.queryByTestId('video-captions-cue-0')).toBeNull();
    await reportProgress(0.3);
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('Hello');
  });

  it('asks the player for progress at the interval from the config (SUB-TIME-03)', async () => {
    await renderPlayer({ progressUpdateInterval: 100 });
    expect(nativeVideo().props.progressUpdateInterval).toBe(100);
  });
});

describe('who draws the subtitles', () => {
  it("lets a layout's own subtitles replace the player's, so each cue shows once", async () => {
    await render(player({}, source, <VideoPlayer.Captions controlsInset={72} />));
    expect(screen.getAllByTestId('video-captions')).toHaveLength(1);
    await loadVideo();
    await flush();
    expect(screen.getAllByTestId('video-captions-cue-0-text')).toHaveLength(1);
  });

  /** Renders DefaultLayout, loads a cue, and lays out its controls in a 360-high area. */
  const withDefaultLayout = async () => {
    await render(player({}, source, <><DefaultLayout /><Controls /></>));
    expect(screen.getAllByTestId('video-captions')).toHaveLength(1);
    await loadVideo();
    await flush();
    const hidden = { includeHiddenElements: true };
    const layout = (testID: string, rect: { y: number; height: number }) =>
      act(() =>
        fireEvent(screen.getByTestId(testID, hidden), 'layout', { nativeEvent: { layout: { x: 0, width: 640, ...rect } } })
      );
    await layout('video-controls-area', { y: 0, height: 360 });
    return { layout };
  };
  const cueStack = () => StyleSheet.flatten(screen.getByTestId('video-captions-cues').props.style);

  it('draws them once with DefaultLayout, above its bottom bar while the controls show', async () => {
    const { layout } = await withDefaultLayout();
    // The bar's top edge 300 down, so the bar covers the bottom 60
    await layout('video-controls-bottom', { y: 300, height: 60 });
    // How far up from the player's bottom edge the cues start
    const lowestCue = () => cueStack().bottom - cueStack().transform[0].translateY;
    expect(lowestCue()).toBeGreaterThan(60);
    await act(() => controls.current!.hideControls());
    expect(lowestCue()).toBeLessThan(60);
  });

  it("hides them while DefaultLayout's controls show, when they'd reach its play button", async () => {
    const { layout } = await withDefaultLayout();
    await layout('video-controls-bottom', { y: 300, height: 60 });
    // The play button's group ends 210 down, 150 up from the bottom: no room for a 100-high cue
    await layout('video-controls-center', { y: 150, height: 60 });
    await act(() => fireEvent(screen.getByTestId('video-captions-cues'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 640, height: 100 } } }));
    expect(cueStack().opacity).toBe(0);
    await act(() => controls.current!.hideControls());
    expect(cueStack().opacity).toBe(1);
  });

});

describe('HLS subtitle renditions', () => {
  const MASTER = [
    '#EXTM3U',
    '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",DEFAULT=YES,URI="subs/en.m3u8"',
    '#EXT-X-STREAM-INF:BANDWIDTH=1000,SUBTITLES="subs"',
    'video.m3u8',
  ].join('\n');
  const MEDIA = '#EXTM3U\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXTINF:10,\nseg0.vtt\n#EXT-X-ENDLIST';
  const SEGMENT = 'WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n00:00.000 --> 00:10.000\nFrom HLS';

  it("lists them from 2000 in place of the player's own, and fetches them with the stream's headers", async () => {
    const bodies: Record<string, string> = {
      'https://example.com/master.m3u8': MASTER,
      'https://example.com/subs/en.m3u8': MEDIA,
      'https://example.com/subs/seg0.vtt': SEGMENT,
    };
    global.fetch = jest.fn(async (url: string) => ({
      ok: url in bodies,
      status: url in bodies ? 200 : 404,
      arrayBuffer: async () => new TextEncoder().encode(bodies[url] ?? '').buffer,
    })) as unknown as typeof fetch;
    const hls = { uri: 'https://example.com/master.m3u8', headers: { Authorization: 'Bearer t' } };
    await render(player({}, hls));
    await flush();
    await loadVideo([{ index: 0, language: 'en', title: 'CC' }]);
    await flush();
    await flush();
    // Off, then the rendition; the player's own track goes
    expect(settings().textTracks.map((track) => [track.index, track.title])).toEqual([
      [-1, 'Off'],
      [2000, 'English'],
    ]);
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls.map(([url]) => url)).toContain('https://example.com/subs/seg0.vtt');
    expect(calls.every(([, init]) => init.headers?.Authorization === 'Bearer t')).toBe(true);
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('From HLS');
  });

  it("reports a master playlist that fails to load, and keeps the player's own tracks", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch;
    const onCaptionError = jest.fn();
    await render(player({ onCaptionError }, { uri: 'https://example.com/master.m3u8' }));
    await flush();
    await loadVideo([{ index: 0, language: 'en', title: 'CC' }]);
    expect(onCaptionError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'LOAD_FAILED', url: 'https://example.com/master.m3u8' })
    );
    expect(settings().textTracks.map((track) => track.index)).toEqual([-1, 0]);
  });
});

describe('subtitle file requests', () => {
  it("never send the stream's headers, which may hold a token for another host", async () => {
    await render(player({}, { ...source, headers: { Authorization: 'Bearer t' } }));
    await loadVideo();
    await flush();
    const calls = (global.fetch as jest.Mock).mock.calls.filter(([url]) => String(url).endsWith('.vtt'));
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every(([, init]) => init?.headers === undefined)).toBe(true);
  });

  it('send the headers given with the file, and only those', async () => {
    const textTracks = source.textTracks.map((track) =>
      track.language === 'en' ? { ...track, headers: { Referer: 'https://example.com/' } } : track
    );
    await render(player({}, { ...source, headers: { Authorization: 'Bearer t' }, textTracks }));
    await loadVideo();
    await flush();
    const calls = (global.fetch as jest.Mock).mock.calls.filter(([url]) => url === 'https://example.com/en.vtt');
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every(([, init]) => init?.headers?.Referer === 'https://example.com/')).toBe(true);
    expect(calls.every(([, init]) => init?.headers?.Authorization === undefined)).toBe(true);
  });
});

describe('subtitles drawn by the player', () => {
  it('passes subtitle files to the player as before', async () => {
    await renderPlayer({ captionRenderer: 'native' });
    expect(nativeVideo().props.source).toEqual(source);
    expect(screen.queryByTestId('video-captions')).toBeNull();
  });
});
