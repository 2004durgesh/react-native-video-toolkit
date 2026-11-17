import React, { useImperativeHandle, type Ref } from 'react';
import { Dimensions } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { VideoProvider, useVideo, useVideoSelector, useTheme } from '../index';
import { useControlsVisibility } from '../../hooks';
import { defaultCaptionsTheme, defaultTheme } from '../../themes';
import type { Theme, ThemeOverrides, VideoPlayerConfig } from '../../types';

type Probe = { state: ReturnType<typeof useVideo>['state']; dispatch: ReturnType<typeof useVideo>['dispatch'] };

/** Exposes the provider's state, dispatch and controls to the test. */
const Inspector = ({ handle }: { handle: Ref<Probe & { controls: ReturnType<typeof useControlsVisibility> }> }) => {
  const { state, dispatch } = useVideo();
  const controls = useControlsVisibility();
  useImperativeHandle(handle, () => ({ state, dispatch, controls }));
  return null;
};

const setUp = async (props: { config?: Partial<VideoPlayerConfig>; theme?: ThemeOverrides } = {}) => {
  const handle = React.createRef<Probe & { controls: ReturnType<typeof useControlsVisibility> }>();
  const tree = (next: typeof props) => (
    <VideoProvider config={next.config} theme={next.theme}>
      <Inspector handle={handle} />
    </VideoProvider>
  );
  const utils = await render(tree(props));
  return { handle, rerender: (next: typeof props) => utils.rerender(tree(next)) };
};

afterEach(() => {
  jest.useRealTimers();
});

describe('VideoProvider state', () => {
  it('merges config and theme props over the defaults, and applies changes live', async () => {
    const { handle, rerender } = await setUp({
      config: { autoHideDelay: 1000 },
      theme: { colors: { textMain: '#FF0000' } },
    });
    expect(handle.current!.state.config.autoHideDelay).toBe(1000);
    expect(handle.current!.state.config.autoPlay).toBe(true);
    expect(handle.current!.state.theme.colors).toEqual({ ...defaultTheme.colors, textMain: '#FF0000' });

    await rerender({ config: { autoHideDelay: 2000 } });
    expect(handle.current!.state.config.autoHideDelay).toBe(2000);
    expect(handle.current!.state.theme.colors).toEqual(defaultTheme.colors);
  });

  it('merges every partial theme group over its defaults', async () => {
    const { handle } = await setUp({ theme: { iconSizes: { lg: 40 }, captions: { color: '#FF0' } } });
    expect(handle.current!.state.theme.iconSizes).toEqual({ ...defaultTheme.iconSizes, lg: 40 });
    expect(handle.current!.state.theme.captions).toEqual({ ...defaultCaptionsTheme, color: '#FF0' });
  });

  it('keeps the same state for an equal inline theme with nested values', async () => {
    const theme = () => ({ captions: { shadowColor: '#000', shadowOffset: { width: 1, height: 1 } } });
    const { handle, rerender } = await setUp({ theme: theme() });
    const before = handle.current!.state;
    await rerender({ theme: theme() });
    expect(handle.current!.state).toBe(before);
  });

  it('starts from the window size when it is created, not when the module loaded', async () => {
    const window = { width: 1024, height: 600, scale: 2, fontScale: 1 };
    Dimensions.set({ window, screen: window });
    const { handle } = await setUp();
    expect(handle.current!.state.dimensions).toEqual({ width: 1024, height: 600 });
  });

  it('keeps a default when a prop is explicitly undefined', async () => {
    const { handle } = await setUp({ config: { autoHideDelay: undefined } });
    expect(handle.current!.state.config.autoHideDelay).toBe(5000);
  });

  it('keeps the same state for an equal inline config and theme, so nothing re-renders', async () => {
    const config = { autoHideDelay: 1000, playbackRates: [1, 2] };
    const theme = { colors: { textMain: '#FF0000' } };
    const { handle, rerender } = await setUp({ config, theme });
    const before = handle.current!.state;
    await rerender({ config: { ...config, playbackRates: [1, 2] }, theme: { colors: { ...theme.colors } } });
    expect(handle.current!.state).toBe(before);
  });

  it('keeps the same state when an action changes nothing', async () => {
    const { handle } = await setUp({ config: { autoPlay: false } });
    const before = handle.current!.state;
    await act(() => handle.current!.dispatch({ type: 'SET_PLAYING', payload: false }));
    await act(() => handle.current!.dispatch({ type: 'SET_FULLSCREEN', payload: false }));
    expect(handle.current!.state).toBe(before);
  });

  it('starts paused with autoPlay off, and playing clears ended', async () => {
    const { handle } = await setUp({ config: { autoPlay: false } });
    expect(handle.current!.state.isPlaying).toBe(false);
    await act(() => handle.current!.dispatch({ type: 'SET_ENDED', payload: true }));
    await act(() => handle.current!.dispatch({ type: 'SET_PLAYING', payload: true }));
    expect(handle.current!.state).toMatchObject({ isPlaying: true, ended: false });
  });

  it('re-renders a field reader only when that field changes, not for a new inline callback', async () => {
    let renders = 0;
    const Reader = () => {
      renders += 1;
      useVideoSelector((state) => state.config.autoHideDelay);
      return null;
    };
    // The same element each time, so only a store change can re-render it
    const reader = <Reader />;
    const tree = (onHideControls: () => void) => (
      <VideoProvider config={{ autoHideDelay: 1000, onHideControls }}>{reader}</VideoProvider>
    );
    const utils = await render(tree(() => {}));
    const afterMount = renders;
    await utils.rerender(tree(() => {}));
    expect(renders).toBe(afterMount);
  });

  it('gives useTheme the provider theme', async () => {
    let seen: Theme | undefined;
    const Reader = () => {
      seen = useTheme();
      return null;
    };
    await render(
      <VideoProvider theme={{ colors: { textMain: '#123456' } }}>
        <Reader />
      </VideoProvider>
    );
    expect(seen?.colors.textMain).toBe('#123456');
  });
});

describe('VideoProvider controls', () => {
  it('hides the controls after the delay while playing', async () => {
    jest.useFakeTimers();
    const { handle } = await setUp({ config: { autoHideDelay: 1000 } });
    expect(handle.current!.state.controlsVisible).toBe(true);
    await act(() => jest.advanceTimersByTime(999));
    expect(handle.current!.state.controlsVisible).toBe(true);
    await act(() => jest.advanceTimersByTime(1));
    expect(handle.current!.state.controlsVisible).toBe(false);
  });

  it('reports showing and hiding only when the controls change', async () => {
    jest.useFakeTimers();
    const onShowControls = jest.fn();
    const onHideControls = jest.fn();
    const { handle } = await setUp({ config: { autoHideDelay: 1000, onShowControls, onHideControls } });
    // The controls start visible
    expect(onShowControls).not.toHaveBeenCalled();

    await act(() => handle.current!.controls.hideControls());
    await act(() => handle.current!.controls.hideControls());
    expect(onHideControls).toHaveBeenCalledTimes(1);

    await act(() => handle.current!.controls.showControls());
    await act(() => handle.current!.controls.showControls());
    expect(onShowControls).toHaveBeenCalledTimes(1);
  });

  it('keeps the controls up while paused', async () => {
    jest.useFakeTimers();
    const { handle } = await setUp({ config: { autoPlay: false, autoHideDelay: 1000 } });
    await act(() => jest.advanceTimersByTime(5000));
    expect(handle.current!.state.controlsVisible).toBe(true);
  });

  it('shows the controls and restarts the timer when playback starts', async () => {
    jest.useFakeTimers();
    const { handle } = await setUp({ config: { autoPlay: false, autoHideDelay: 1000 } });
    await act(() => handle.current!.controls.hideControls());
    expect(handle.current!.state.controlsVisible).toBe(false);
    await act(() => handle.current!.dispatch({ type: 'SET_PLAYING', payload: true }));
    expect(handle.current!.state.controlsVisible).toBe(true);
    await act(() => jest.advanceTimersByTime(1000));
    expect(handle.current!.state.controlsVisible).toBe(false);
  });

  it('toggles, and one timer serves every caller', async () => {
    jest.useFakeTimers();
    const { handle } = await setUp({ config: { autoHideDelay: 1000 } });
    await act(() => handle.current!.controls.toggleControls());
    expect(handle.current!.state.controlsVisible).toBe(false);
    await act(() => handle.current!.controls.toggleControls());
    await act(() => jest.advanceTimersByTime(600));
    // Showing again restarts the one timer instead of adding a second
    await act(() => handle.current!.controls.showControls());
    await act(() => jest.advanceTimersByTime(600));
    expect(handle.current!.state.controlsVisible).toBe(true);
    await act(() => jest.advanceTimersByTime(400));
    expect(handle.current!.state.controlsVisible).toBe(false);
  });
});

describe('VideoProvider window size', () => {
  it('follows window size changes', async () => {
    const { handle } = await setUp();
    const window = { width: 900, height: 400, scale: 2, fontScale: 1 };
    await act(() => Dimensions.set({ window, screen: window }));
    expect(handle.current!.state.dimensions).toEqual({ width: 900, height: 400 });
  });
});
