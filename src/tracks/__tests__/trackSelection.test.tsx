import React, { useImperativeHandle, type Ref } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { VideoProvider } from '../../providers';
import { VideoPlayer } from '../../components/VideoPlayer';
import { SubtitleToggleButton } from '../../components/controls/SubtitleToggleButton';
import { useSettings } from '../../hooks';
import { trackLabel, languageDisplayName } from '../../utils';
import { pickAudioTrack, pickTextTrack } from '../selection';

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

type Track = { index: number; language?: string; title?: string; selected?: boolean };
type VideoTrackInfo = { index: number; width: number; height: number; bitrate: number };

const Inspector = ({ handle }: { handle: Ref<ReturnType<typeof useSettings>> }) => {
  const settings = useSettings();
  useImperativeHandle(handle, () => settings);
  return null;
};

const handle = React.createRef<ReturnType<typeof useSettings>>();
const player = (uri: string) => (
  <GestureHandlerRootView>
    <VideoProvider config={{ autoPlay: false }}>
      <VideoPlayer source={{ uri }}>
        <Inspector handle={handle} />
        <SubtitleToggleButton />
      </VideoPlayer>
    </VideoProvider>
  </GestureHandlerRootView>
);

const nativeVideo = () => screen.getByTestId('native-video');

const load = async (
  tracks: { textTracks?: Track[]; audioTracks?: Track[]; videoTracks?: VideoTrackInfo[] },
  height = 1080
) => {
  await act(() => nativeVideo().props.onLoadStart?.({}));
  await act(() =>
    nativeVideo().props.onLoad?.({
      duration: 60,
      currentTime: 0,
      naturalSize: { width: 1920, height, orientation: 'landscape' },
      audioTracks: tracks.audioTracks ?? [],
      videoTracks: tracks.videoTracks ?? [],
      textTracks: tracks.textTracks ?? [],
    })
  );
};

const settings = () => handle.current!;

describe('subtitle tracks', () => {
  it('turns on the device language (English here) when a video first loads', async () => {
    await render(player('https://example.com/a.mp4'));
    await load({ textTracks: [{ index: 0, language: 'de' }, { index: 1, language: 'en' }] });
    expect(settings().textTrack).toMatchObject({ index: 1, language: 'en' });
    expect(nativeVideo().props.selectedTextTrack).toEqual({ type: 'index', value: 1 });
  });

  it("falls back to the player's own pick, then the first track", async () => {
    await render(player('https://example.com/a.mp4'));
    await load({ textTracks: [{ index: 0, language: 'de' }, { index: 1, language: 'fr', selected: true }] });
    expect(settings().textTrack).toMatchObject({ language: 'fr' });
  });

  it("keeps the viewer's language on the next video, whatever its index there", async () => {
    const { rerender } = await render(player('https://example.com/a.mp4'));
    await load({ textTracks: [{ index: 0, language: 'en' }, { index: 1, language: 'fr' }] });
    await act(() => settings().setTextTrack(settings().textTracks.find((track) => track.language === 'fr')!));
    await rerender(player('https://example.com/b.mp4'));
    await load({ textTracks: [{ index: 0, language: 'fr' }, { index: 1, language: 'en' }] });
    expect(settings().textTrack).toMatchObject({ index: 0, language: 'fr' });
  });

  it('keeps subtitles off on the next video', async () => {
    const { rerender } = await render(player('https://example.com/a.mp4'));
    await load({ textTracks: [{ index: 0, language: 'en' }] });
    await act(() => settings().setTextTrack(settings().textTracks.find((track) => track.index === -1)!));
    await rerender(player('https://example.com/b.mp4'));
    await load({ textTracks: [{ index: 0, language: 'en' }] });
    expect(settings().textTrack?.index).toBe(-1);
    expect(nativeVideo().props.selectedTextTrack).toEqual({ type: 'disabled' });
  });

  it('lists Off first, and the subtitles button turns the same language back on', async () => {
    await render(player('https://example.com/a.mp4'));
    await load({ textTracks: [{ index: 0, language: 'en' }, { index: 1, language: 'fr' }] });
    expect(settings().textTracks[0]?.index).toBe(-1);
    await act(() => settings().setTextTrack(settings().textTracks.find((track) => track.language === 'fr')!));
    await act(() => fireGestureHandler(getByGestureTestId('video-subtitles-button')));
    expect(settings().textTrack?.index).toBe(-1);
    await act(() => fireGestureHandler(getByGestureTestId('video-subtitles-button')));
    expect(settings().textTrack).toMatchObject({ language: 'fr' });
  });
});

describe('audio tracks', () => {
  it("starts on the player's pick, then keeps the viewer's language on the next video", async () => {
    const { rerender } = await render(player('https://example.com/a.mp4'));
    await load({ audioTracks: [{ index: 0, language: 'en' }, { index: 1, language: 'ja', selected: true }] });
    expect(settings().audioTrack).toMatchObject({ language: 'ja' });
    await act(() => settings().setAudioTrack(settings().audioTracks.find((track) => track.language === 'en')!));
    await rerender(player('https://example.com/b.mp4'));
    await load({ audioTracks: [{ index: 0, language: 'ja', selected: true }, { index: 1, language: 'en' }] });
    expect(settings().audioTrack).toMatchObject({ index: 1, language: 'en' });
  });
});

describe('video tracks', () => {
  const videoTracks = [
    { index: 0, width: 1280, height: 720, bitrate: 1 },
    { index: 1, width: 1920, height: 1080, bitrate: 2 },
  ];

  it('stays on Auto unless the viewer picks a quality the next video also has', async () => {
    const { rerender } = await render(player('https://example.com/a.mp4'));
    await load({ videoTracks });
    expect(settings().videoTrack).toBeNull();
    await act(() => settings().setVideoTrack(settings().videoTracks.find((track) => track.height === 720)!));
    await rerender(player('https://example.com/b.mp4'));
    await load({ videoTracks });
    expect(settings().videoTrack).toMatchObject({ height: 720 });
    await rerender(player('https://example.com/c.mp4'));
    await load({ videoTracks: [{ index: 0, width: 1920, height: 1080, bitrate: 2 }] });
    expect(settings().videoTrack).toBeNull();
  });
});

describe('device language', () => {
  it('recognises three-letter codes, so Spanish and German tracks match a Spanish or German device', () => {
    const tracks = [
      { index: 0, language: 'eng' },
      { index: 1, language: 'spa' },
      { index: 2, language: 'ger' },
    ];
    expect(pickTextTrack(tracks, null, 'es')).toMatchObject({ language: 'spa' });
    expect(pickAudioTrack(tracks, null, 'de')).toMatchObject({ language: 'ger' });
  });
});

describe('track labels', () => {
  it("names a track by its title, else its language, ignoring the player's placeholders", () => {
    expect(trackLabel({ title: 'Director commentary', language: 'en' })).toBe('Director commentary');
    expect(trackLabel({ title: 'Track 1', language: 'spa' })).toBe('Spanish');
    expect(trackLabel({ language: 'pt-BR' })).toBe('Portuguese (BR)');
    expect(languageDisplayName('und')).toBeUndefined();
  });
});
