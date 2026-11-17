import React, { useImperativeHandle, useState, type Ref } from 'react';
import { TextTrackType } from 'react-native-video';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { VideoProvider, useVideoStore } from '../../providers/VideoProvider';
import { useProgressStore } from '../../providers/ProgressStore';
import { Captions } from '../Captions';
import { useCaptionsController } from '../CaptionsController';
import type { CaptionTrack } from '../types';
import { clearCaptionCache } from '../load';
import * as textModule from '../parse/text';
import type { Theme, VideoPlayerConfig } from '../../types';

const VTT = [
  'WEBVTT',
  '',
  '00:01.000 --> 00:02.000',
  'Hello <b>world</b>',
  '',
  '00:03.000 --> 00:04.000',
  'مرحبا بالعالم',
].join('\n');

/** A subtitle file track, as the toolkit lists it. */
const file = (uri: string): CaptionTrack => ({ index: 1000, source: 'file', uri, type: TextTrackType.VTT });

type Insets = { controlsInset: number; centerControlsInset: number };

interface Handle {
  select: (track: CaptionTrack | null) => void;
  seek: (seconds: number) => void;
  layout: (width: number, height: number, natural?: { width: number; height: number }) => void;
  showControls: (visible: boolean, inset?: number, centerInset?: number) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setResizeMode: (mode: 'contain' | 'cover' | 'stretch' | 'none') => void;
}

/** The subtitles, with the insets a layout would pass. */
const CaptionsUnderTest = ({ insetsRef }: { insetsRef: Ref<(insets: Insets) => void> }) => {
  const [insets, setInsets] = useState<Insets>({ controlsInset: 0, centerControlsInset: 0 });
  useImperativeHandle(insetsRef, () => setInsets);
  return <Captions {...insets} />;
};

/** Reaches into the provider to drive it like the player would. */
const Driver = ({ handle, insetsRef }: { handle: Ref<Handle>; insetsRef: React.RefObject<((insets: Insets) => void) | null> }) => {
  const captions = useCaptionsController();
  const store = useVideoStore();
  const progress = useProgressStore();
  useImperativeHandle(handle, () => ({
    select: captions.select,
    seek: (seconds) => progress.update({ currentTime: seconds }),
    layout: (width, height, natural = { width, height }) => {
      fireEvent(screen.getByTestId('video-captions'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height } },
      });
      store.dispatch({ type: 'SET_NATURAL_SIZE', payload: natural });
    },
    showControls: (visible, inset = 0, centerInset = 0) => {
      insetsRef.current?.({ controlsInset: inset, centerControlsInset: centerInset });
      store.dispatch({ type: 'SET_CONTROLS_VISIBLE', payload: visible });
    },
    setFullscreen: (fullscreen) => store.dispatch({ type: 'SET_FULLSCREEN', payload: fullscreen }),
    setResizeMode: (mode) => store.dispatch({ type: 'SET_RESIZE_MODE', payload: mode }),
  }));
  return null;
};

const setUp = async (theme?: Partial<Theme>, config: Partial<VideoPlayerConfig> = {}) => {
  const handle = React.createRef<Handle>();
  const insetsRef = React.createRef<(insets: Insets) => void>();
  const utils = await render(
    <VideoProvider config={{ autoPlay: false, ...config }} theme={theme}>
      <Driver handle={handle} insetsRef={insetsRef} />
      <CaptionsUnderTest insetsRef={insetsRef} />
    </VideoProvider>
  );
  const player = handle.current!;
  await act(() => player.layout(640, 360));
  return { ...utils, player };
};

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
};

beforeEach(() => {
  clearCaptionCache();
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => new TextEncoder().encode(VTT).buffer,
  })) as unknown as typeof fetch;
});

describe('Captions', () => {
  it('shows the cue for the time with its styled spans, and nothing in gaps (SUB-SEL-02)', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    expect(screen.queryByTestId('video-captions-cue-0')).toBeNull();

    await act(() => player.seek(1.5));
    expect(screen.getByTestId('video-captions-cue-0')).toBeTruthy();
    expect(screen.getByText('world')).toHaveStyle({ fontWeight: 'bold' });

    await act(() => player.seek(2.5));
    // A gap: no cue, and no empty box
    expect(screen.queryByTestId('video-captions-cue-0')).toBeNull();
  });

  it('draws right-to-left cues right to left (SUB-I18N-01)', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/ar.vtt')));
    await flush();
    await act(() => player.seek(3.5));
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveStyle({ writingDirection: 'rtl' });
  });

  it('applies the theme and a readable default box (SUB-STYLE-01, 02, SUB-A11Y-01)', async () => {
    const { player } = await setUp({ captions: { color: '#FFEB3B', fontSize: 22, fontFamily: 'Menlo', letterSpacing: 1 } });
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveStyle({
      color: '#FFEB3B',
      fontSize: 22,
      fontFamily: 'Menlo',
      letterSpacing: 1,
    });
    const box = StyleSheet.flatten(screen.getByTestId('video-captions-cue-0').props.style);
    expect(box.backgroundColor).toBe('rgba(0, 0, 0, 0.75)');
  });

  it('sizes the text from the picture and keeps the box on the picture (SUB-LAY-01, 02)', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    // A 4:3 video in a 640×360 box: a 480×360 picture, centred
    await act(() => player.layout(640, 360, { width: 1440, height: 1080 }));
    await act(() => player.seek(1.5));
    const cues = screen.getByTestId('video-captions-cue-0').parent!.parent!;
    const position = StyleSheet.flatten(cues.props.style);
    expect(position).toMatchObject({ left: 80, width: 480, bottom: 18 });
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveStyle({ fontSize: 20 });
  });

  it('falls back to the whole layer before the video size is known, and shows nothing with no room', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.layout(640, 360, { width: 0, height: 0 }));
    await act(() => player.seek(1.5));
    const cues = screen.getByTestId('video-captions-cue-0').parent!.parent!;
    expect(StyleSheet.flatten(cues.props.style)).toMatchObject({ left: 0, width: 640 });
    await act(() => player.layout(0, 0, { width: 0, height: 0 }));
    expect(screen.queryByTestId('video-captions-cue-0')).toBeNull();
  });

  it('wraps long cues to at most three lines', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    expect(screen.getByTestId('video-captions-cue-0-text').props.numberOfLines).toBe(3);
  });

  it('restyles a showing cue when the theme changes, without reloading', async () => {
    const { player, rerender } = await setUp({ captions: { color: '#FFFFFF' } });
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    const handle = React.createRef<Handle>();
    const insetsRef = React.createRef<(insets: Insets) => void>();
    await rerender(
      <VideoProvider config={{ autoPlay: false }} theme={{ captions: { color: '#FFEB3B' } }}>
        <Driver handle={handle} insetsRef={insetsRef} />
        <CaptionsUnderTest insetsRef={insetsRef} />
      </VideoProvider>
    );
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveStyle({ color: '#FFEB3B' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('hides while the controls show when there is no room under the centre controls', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    const stack = () => screen.getByTestId('video-captions-cue-0').parent!.parent!;
    await act(() => fireEvent(stack(), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 576, height: 32 } } }));
    // Bottom controls 60 high, centre controls starting 150 up: room for the 32-high cue
    await act(() => player.showControls(true, 60, 150));
    expect(StyleSheet.flatten(stack().props.style).opacity).toBe(1);
    // Centre controls starting 90 up: the lifted cue would reach under them
    await act(() => player.showControls(true, 60, 90));
    expect(StyleSheet.flatten(stack().props.style).opacity).toBe(0);
    // Controls hidden: back at the bottom, shown
    await act(() => player.showControls(false, 60, 90));
    expect(StyleSheet.flatten(stack().props.style).opacity).toBe(1);
  });

  it('keeps clear of safe areas in fullscreen only', async () => {
    const { player } = await setUp(undefined, { safeAreaInsets: { bottom: 34 } });
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    const bottom = () => StyleSheet.flatten(screen.getByTestId('video-captions-cue-0').parent!.parent!.props.style).bottom;
    expect(bottom()).toBe(18);
    await act(() => player.setFullscreen(true));
    expect(bottom()).toBe(18 + 34);
  });

  it('places cues on the picture the video actually draws, for every resize mode', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    // A 4:3 video in a 640x360 box
    await act(() => player.layout(640, 360, { width: 1440, height: 1080 }));
    await act(() => player.seek(1.5));
    const position = () => StyleSheet.flatten(screen.getByTestId('video-captions-cue-0').parent!.parent!.props.style);
    expect(position()).toMatchObject({ left: 80, width: 480 });
    // Cover fills the box (the picture's top and bottom are cut off), as stretch does
    await act(() => player.setResizeMode('cover'));
    expect(position()).toMatchObject({ left: 0, width: 640 });
    await act(() => player.setResizeMode('stretch'));
    expect(position()).toMatchObject({ left: 0, width: 640 });
  });

  it('moves above the controls while they show (SUB-LAY-04)', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    await act(() => player.showControls(true, 88));
    const lifted = StyleSheet.flatten(screen.getByTestId('video-captions-cue-0').parent!.parent!.props.style);
    expect(lifted.transform).toEqual([{ translateY: -(88 + 8 - 18) }]);
    await act(() => player.showControls(false, 88));
    const lowered = StyleSheet.flatten(screen.getByTestId('video-captions-cue-0').parent!.parent!.props.style);
    expect(lowered.transform).toEqual([{ translateY: 0 }]);
  });

  it('switches tracks mid-cue without showing the old one (SUB-TRACK-03)', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    expect(screen.getByText('world')).toBeTruthy();
    await act(() => player.select(null));
    expect(screen.queryByText('world')).toBeNull();
  });

  it('takes no touches (SUB-LAY-11)', async () => {
    await setUp();
    expect(StyleSheet.flatten(screen.getByTestId('video-captions').props.style).pointerEvents).toBe('none');
  });

  it('renders nothing instead of crashing when a cue cannot render (SUB-ERR-01)', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // A span React can't render
    jest.spyOn(textModule, 'parseInline').mockReturnValue([{ text: {} as unknown as string }]);
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    expect(screen.queryByTestId('video-captions')).toBeNull();
    jest.restoreAllMocks();
  });

  it('stops its work when the player unmounts (SUB-LOAD-05, SUB-PERF-04)', async () => {
    const { player, unmount } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await unmount();
    await flush();
    expect(screen.queryByTestId('video-captions')).toBeNull();
  });
});
