import React, { useImperativeHandle, type Ref } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { VideoProvider, useVideo } from '../../../providers';
import { VideoPlayer } from '../../VideoPlayer';
import { DefaultLayout } from '../../../layouts/DefaultLayout';

// A TV: the toolkit picks its remote-driven parts as its modules load
jest.mock('../../../utils/platform', () => {
  const actual = jest.requireActual('../../../utils/platform');
  return { ...actual, PlatformUtils: { ...actual.PlatformUtils, isTV: () => true } };
});

const Inspector = ({ handle }: { handle: Ref<ReturnType<typeof useVideo>> }) => {
  const video = useVideo();
  useImperativeHandle(handle, () => video);
  return null;
};
const handle = React.createRef<ReturnType<typeof useVideo>>();

const setUp = () =>
  render(
    <GestureHandlerRootView>
      <VideoProvider config={{ autoPlay: false }}>
        <VideoPlayer source={{ uri: 'https://example.com/movie.mp4' }}>
          <Inspector handle={handle} />
          <DefaultLayout />
        </VideoPlayer>
      </VideoProvider>
    </GestureHandlerRootView>
  );

const element = (testID: string) => screen.getByTestId(testID, { includeHiddenElements: true });
const prefersFocus = (testID: string) => element(testID).props.hasTVPreferredFocus === true;
const setControlsVisible = (visible: boolean) =>
  act(() => handle.current!.dispatch({ type: 'SET_CONTROLS_VISIBLE', payload: visible }));

/** The remote selects the settings button, focusing it first. */
const openFromSettingsButton = async () => {
  await act(() => fireEvent(element('video-settings-button'), 'focus'));
  await act(() => fireEvent.press(element('video-settings-button')));
  expect(screen.queryByTestId('video-settings')).not.toBeNull();
};

describe('the settings menu on TV', () => {
  it('sends the remote back to the settings button as it closes', async () => {
    await setUp();
    await openFromSettingsButton();
    expect(prefersFocus('video-settings-button')).toBe(false);
    // Moving through the menu's own buttons doesn't change where the remote goes back to
    await act(() => fireEvent(element('video-settings-close'), 'focus'));
    await act(() => fireEvent.press(element('video-settings-close')));
    expect(screen.queryByTestId('video-settings')).toBeNull();
    expect(prefersFocus('video-settings-button')).toBe(true);
  });

  it('sends the remote to the player when the controls hid meanwhile, and keeps its buttons focusable', async () => {
    await setUp();
    await openFromSettingsButton();
    await setControlsVisible(false);
    expect(element('video-settings-close').props.focusable).toBe(true);
    await act(() => fireEvent.press(element('video-settings-close')));
    expect(handle.current!.state.controlsVisible).toBe(false);
    expect(prefersFocus('video-tv-surface')).toBe(true);
    expect(prefersFocus('video-settings-button')).toBe(false);
  });
});
