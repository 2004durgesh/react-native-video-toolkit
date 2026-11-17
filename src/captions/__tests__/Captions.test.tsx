import React, { useImperativeHandle, useState, type Ref } from 'react';
import { TextTrackType } from 'react-native-video';
import { StyleSheet, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { VideoProvider, useVideoStore } from '../../providers/VideoProvider';
import { useProgressStore } from '../../providers/ProgressStore';
import { Captions } from '../Captions';
import { useCaptionsController } from '../CaptionsController';
import type { CaptionTrack } from '../types';
import { clearCaptionCache } from '../load';
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
type SetInsets = React.Dispatch<Insets>;

interface Handle {
  select: (track: CaptionTrack | null) => void;
  seek: (seconds: number) => void;
  layout: (width: number, height: number, natural?: { width: number; height: number }) => void;
  showControls: (visible: boolean, inset?: number, centerInset?: number) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setResizeMode: (mode: 'contain' | 'cover' | 'stretch' | 'none') => void;
}

/** The subtitles, with the insets a layout would pass. */
const CaptionsUnderTest = ({ insetsRef }: { insetsRef: Ref<SetInsets> }) => {
  const [insets, setInsets] = useState<Insets>({ controlsInset: 0, centerControlsInset: 0 });
  useImperativeHandle(insetsRef, () => setInsets);
  return <Captions {...insets} />;
};

/** Reaches into the provider to drive it like the player would. */
const Driver = ({ handle, insetsRef }: { handle: Ref<Handle>; insetsRef: React.RefObject<SetInsets | null> }) => {
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

const tree = (handle: Ref<Handle>, theme?: Partial<Theme>, config: Partial<VideoPlayerConfig> = {}) => {
  const insetsRef = React.createRef<SetInsets>();
  return (
    <VideoProvider config={{ autoPlay: false, ...config }} theme={theme}>
      <Driver handle={handle} insetsRef={insetsRef} />
      <CaptionsUnderTest insetsRef={insetsRef} />
      {/* Stands in for the rest of the player */}
      <View testID="controls" />
    </VideoProvider>
  );
};

const setUp = async (theme?: Partial<Theme>, config: Partial<VideoPlayerConfig> = {}) => {
  const handle = React.createRef<Handle>();
  const utils = await render(tree(handle, theme, config));
  const player = handle.current!;
  await act(() => player.layout(640, 360));
  return { ...utils, player };
};

/** Where the stack of cues sits in the layer. */
const cueStack = () =>
  StyleSheet.flatten(screen.getByTestId('video-captions-cues').props.style) as {
    left: number;
    width: number;
    bottom: number;
    opacity: number;
    transform: { translateY: number }[];
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

  it('applies the theme to the text and its box (SUB-STYLE-01, 02)', async () => {
    const { player } = await setUp({
      captions: {
        color: '#FFEB3B',
        fontSize: 22,
        fontFamily: 'Menlo',
        letterSpacing: 1,
        backgroundColor: 'rgba(20, 20, 60, 0.5)',
        maxLines: 2,
      },
    });
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    const text = screen.getByTestId('video-captions-cue-0-text');
    expect(text).toHaveStyle({ color: '#FFEB3B', fontSize: 22, fontFamily: 'Menlo', letterSpacing: 1 });
    expect(text.props.numberOfLines).toBe(2);
    expect(screen.getByTestId('video-captions-cue-0')).toHaveStyle({ backgroundColor: 'rgba(20, 20, 60, 0.5)' });
  });

  it('sizes the text from the picture, and keeps the cues off the black bars of a wider video (SUB-LAY-01, 02)', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    const fullHeight = StyleSheet.flatten(screen.getByTestId('video-captions-cue-0-text').props.style).fontSize!;
    // A 20:9 video in a 640×360 box: a 640×288 picture, with 36-high bars above and below
    await act(() => player.layout(640, 360, { width: 1600, height: 720 }));
    const letterboxed = StyleSheet.flatten(screen.getByTestId('video-captions-cue-0-text').props.style).fontSize!;
    expect(letterboxed).toBeLessThan(fullHeight);
    expect(cueStack().bottom).toBeGreaterThan(36);
  });

  it('falls back to the whole layer before the video size is known, and shows nothing with no room', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.layout(640, 360, { width: 0, height: 0 }));
    await act(() => player.seek(1.5));
    expect(cueStack()).toMatchObject({ left: 0, width: 640 });
    await act(() => player.layout(0, 0, { width: 0, height: 0 }));
    expect(screen.queryByTestId('video-captions-cue-0')).toBeNull();
  });

  it('restyles a showing cue when the theme changes, without reloading', async () => {
    const handle = React.createRef<Handle>();
    const { player, rerender } = await setUp({ captions: { color: '#FFFFFF' } });
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    await rerender(tree(handle, { captions: { color: '#FFEB3B' } }));
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveStyle({ color: '#FFEB3B' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('hides while the controls show when there is no room under the centre controls', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    const stack = screen.getByTestId('video-captions-cues');
    await act(() => fireEvent(stack, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 576, height: 32 } } }));
    // Bottom controls 60 high, centre controls starting 150 up: room for the 32-high cue
    await act(() => player.showControls(true, 60, 150));
    expect(cueStack().opacity).toBe(1);
    // Centre controls starting 90 up: the lifted cue would reach under them
    await act(() => player.showControls(true, 60, 90));
    expect(cueStack().opacity).toBe(0);
    // Controls hidden: back at the bottom, shown
    await act(() => player.showControls(false, 60, 90));
    expect(cueStack().opacity).toBe(1);
  });

  it('keeps clear of safe areas in fullscreen only', async () => {
    const { player } = await setUp(undefined, { safeAreaInsets: { bottom: 34 } });
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    const inline = cueStack().bottom;
    await act(() => player.setFullscreen(true));
    expect(cueStack().bottom).toBe(inline + 34);
  });

  it('places cues on the picture the video actually draws, for every resize mode (SUB-LAY-02)', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    // A 4:3 video in a 640×360 box: contained, a 480×360 picture, centred
    await act(() => player.layout(640, 360, { width: 1440, height: 1080 }));
    await act(() => player.seek(1.5));
    expect(cueStack()).toMatchObject({ left: 80, width: 480 });
    // Cover fills the box (the picture's top and bottom are cut off), as stretch does
    await act(() => player.setResizeMode('cover'));
    expect(cueStack()).toMatchObject({ left: 0, width: 640 });
    await act(() => player.setResizeMode('stretch'));
    expect(cueStack()).toMatchObject({ left: 0, width: 640 });
  });

  it('moves above the controls while they show (SUB-LAY-04)', async () => {
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    await act(() => player.seek(1.5));
    // How far up from the player's bottom edge the cues start
    const lowestCue = () => cueStack().bottom - cueStack().transform[0]!.translateY;
    const resting = lowestCue();
    await act(() => player.showControls(true, 88));
    // Just above the 88-high controls
    expect(lowestCue()).toBeGreaterThan(88);
    expect(lowestCue()).toBeLessThan(88 + 20);
    await act(() => player.showControls(false, 88));
    expect(lowestCue()).toBe(resting);
  });

  it('takes no touches (SUB-LAY-11)', async () => {
    await setUp();
    expect(StyleSheet.flatten(screen.getByTestId('video-captions').props.style).pointerEvents).toBe('none');
  });

  it('drops only the subtitles when a cue cannot render, and tries again with the next cue (SUB-ERR-01)', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { player } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    await flush();
    // Text React Native can't draw
    const Broken = () => {
      throw new Error('Cannot draw this text');
    };
    const text = jest.spyOn(jest.requireActual('react-native'), 'Text', 'get').mockReturnValue(Broken);
    await act(() => player.seek(1.5));
    expect(screen.queryByTestId('video-captions')).toBeNull();
    expect(screen.getByTestId('controls')).toBeTruthy();

    text.mockRestore();
    await act(() => player.seek(3.5));
    // The layer is back, and lays out as it mounts
    await act(() => player.layout(640, 360));
    expect(screen.getByTestId('video-captions-cue-0-text')).toHaveTextContent('مرحبا بالعالم');
  });

  it('cancels a subtitle load when the player unmounts (SUB-LOAD-05, SUB-PERF-04)', async () => {
    // A file that only ends when cancelled
    global.fetch = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))))
    ) as unknown as typeof fetch;
    const { player, unmount } = await setUp();
    await act(() => player.select(file('https://example.com/en.vtt')));
    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(init.signal?.aborted).toBe(false);
    await unmount();
    expect(init.signal?.aborted).toBe(true);
  });
});
