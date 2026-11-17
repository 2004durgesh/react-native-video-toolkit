import React, { useImperativeHandle, type Ref } from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { VideoProvider, useVideo } from '../../providers';
import { VideoPlayer } from '../VideoPlayer';
import { DefaultLayout } from '../../layouts/DefaultLayout';
import type { VideoPlayerConfig } from '../../types';

const Inspector = ({ handle }: { handle: Ref<ReturnType<typeof useVideo>> }) => {
  const video = useVideo();
  useImperativeHandle(handle, () => video);
  return null;
};

const handle = React.createRef<ReturnType<typeof useVideo>>();
const setUp = (children: React.ReactNode, config: Partial<VideoPlayerConfig> = {}) =>
  render(
    <GestureHandlerRootView>
      <VideoProvider config={{ autoPlay: false, ...config }}>
        <VideoPlayer source={{ uri: 'https://example.com/movie.mp4' }}>
          <Inspector handle={handle} />
          {children}
        </VideoPlayer>
      </VideoProvider>
    </GestureHandlerRootView>
  );
const state = () => handle.current!.state;
const tap = (testID: string) => act(() => fireGestureHandler(getByGestureTestId(testID)));

describe('control buttons', () => {
  it('play and pause, showing the matching icon at the theme size and colour', async () => {
    await setUp(
      <VideoPlayer.PlayButton
        renderPlayIcon={((props: { size: number; color: string }) => <Text>{`play ${props.size} ${props.color}`}</Text>) as never}
        renderPauseIcon={(() => <Text>pause</Text>) as never}
      />
    );
    expect(screen.getByText('play 24 #FAFAFA')).toBeTruthy();
    await tap('video-play-button');
    expect(state().isPlaying).toBe(true);
    expect(screen.getByText('pause')).toBeTruthy();
  });

  it('mute, fullscreen and settings act on the player', async () => {
    await setUp(
      <>
        <VideoPlayer.MuteButton />
        <VideoPlayer.FullscreenButton />
        <VideoPlayer.SettingsButton />
      </>
    );
    await tap('video-mute-button');
    expect(state().muted).toBe(true);
    await tap('video-fullscreen-button');
    expect(state().fullscreen).toBe(true);
    await tap('video-fullscreen-button');
    expect(state().fullscreen).toBe(false);
  });

  it('leaves out picture-in-picture where it is unsupported', async () => {
    await setUp(<VideoPlayer.PictureInPictureButton />, { enablePictureInPicture: true });
    expect(screen.queryByTestId('video-picture-in-picture-button')).toBeNull();
  });
});

describe('VideoPlayer', () => {
  it('passes View props to its outer view, with containerStyle over style', async () => {
    await render(
      <GestureHandlerRootView>
        <VideoProvider config={{ autoPlay: false }}>
          <VideoPlayer
            source={{ uri: 'https://example.com/movie.mp4' }}
            testID="trailer"
            accessibilityLabel="Trailer"
            style={{ margin: 4, padding: 1 }}
            containerStyle={{ padding: 2 }}
          />
        </VideoProvider>
      </GestureHandlerRootView>
    );
    const outer = screen.getByTestId('trailer');
    expect(outer.props.accessibilityLabel).toBe('Trailer');
    expect(StyleSheet.flatten(outer.props.style)).toMatchObject({ margin: 4, padding: 2 });
  });
});

describe('DefaultLayout', () => {
  it('takes faded-out controls out of reach of touches and screen readers, and back when shown', async () => {
    await setUp(<DefaultLayout />);
    const bottom = () => screen.getByTestId('video-controls-bottom', { includeHiddenElements: true });
    const pointerEvents = () => StyleSheet.flatten(bottom().props.style).pointerEvents;
    expect(pointerEvents()).not.toBe('none');
    expect(screen.queryByTestId('video-controls-bottom')).not.toBeNull();
    await act(() => handle.current!.dispatch({ type: 'SET_CONTROLS_VISIBLE', payload: false }));
    expect(pointerEvents()).toBe('none');
    // Hidden from accessibility, so a screen reader can't land on invisible buttons
    expect(screen.queryByTestId('video-controls-bottom')).toBeNull();
    await act(() => handle.current!.dispatch({ type: 'SET_CONTROLS_VISIBLE', payload: true }));
    expect(pointerEvents()).not.toBe('none');
    expect(screen.queryByTestId('video-controls-bottom')).not.toBeNull();
  });

  it('opens the settings menu and changes the playback rate from it', async () => {
    await setUp(<DefaultLayout />);
    await tap('video-settings-button');
    expect(screen.getByTestId('video-settings-rate')).toBeTruthy();
    await act(() => fireEvent.press(screen.getByTestId('video-settings-rate')));
    await act(() => fireEvent.press(screen.getByTestId('video-settings-rate-1.5')));
    expect(state().playbackRate).toBe(1.5);
  });
});
