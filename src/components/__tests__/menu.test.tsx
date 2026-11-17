import React, { useImperativeHandle, type Ref } from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { TextTrackType } from 'react-native-video';
import { VideoProvider, useVideo } from '../../providers';
import { VideoPlayer } from '../VideoPlayer';
import { DefaultLayout, type DefaultLayoutProps } from '../../layouts/DefaultLayout';
import { Menu, useMenuContext } from '../menu';
import { useSettings } from '../../hooks';
import { clearCaptionCache } from '../../captions/load';
import type { CustomVideoTrack, VideoPlayerConfig } from '../../types';

type Player = { video: ReturnType<typeof useVideo>; settings: ReturnType<typeof useSettings> };
const Inspector = ({ handle }: { handle: Ref<Player> }) => {
  const video = useVideo();
  const settings = useSettings();
  useImperativeHandle(handle, () => ({ video, settings }));
  return null;
};
const handle = React.createRef<Player>();
const settings = () => handle.current!.settings;
const video = () => handle.current!.video.state;

const MOVIE = { uri: 'https://example.com/movie.mp4' };

const player = ({
  layout,
  config,
  source = MOVIE,
  customVideoTracks,
  children,
}: {
  layout?: DefaultLayoutProps;
  config?: Partial<VideoPlayerConfig>;
  source?: object;
  customVideoTracks?: CustomVideoTrack[];
  children?: React.ReactNode;
} = {}) => (
  <GestureHandlerRootView>
    <VideoProvider config={{ autoPlay: false, ...config }}>
      <VideoPlayer source={source} customVideoTracks={customVideoTracks}>
        <Inspector handle={handle} />
        {children ?? <DefaultLayout {...layout} />}
      </VideoPlayer>
    </VideoProvider>
  </GestureHandlerRootView>
);
const setUp = (options?: Parameters<typeof player>[0]) => render(player(options));

type Track = { index: number; language?: string; title?: string; selected?: boolean };
type VideoTrackInfo = { index: number; width: number; height: number; bitrate: number };

/** The player loads the video and lists its tracks. */
const load = async (tracks: { audioTracks?: Track[]; videoTracks?: VideoTrackInfo[]; textTracks?: Track[] } = {}) => {
  const nativeVideo = screen.getByTestId('native-video');
  await act(() => nativeVideo.props.onLoadStart?.({}));
  await act(() =>
    screen.getByTestId('native-video').props.onLoad?.({
      duration: 60,
      currentTime: 0,
      naturalSize: { width: 1920, height: 1080, orientation: 'landscape' },
      audioTracks: tracks.audioTracks ?? [],
      videoTracks: tracks.videoTracks ?? [],
      textTracks: tracks.textTracks ?? [],
    })
  );
};

const tap = (testID: string) => act(() => fireGestureHandler(getByGestureTestId(testID)));
const press = (testID: string) => act(() => fireEvent.press(screen.getByTestId(testID)));
const openMenu = () => tap('video-settings-button');
const isOpen = () => screen.queryByTestId('video-settings') !== null;
const title = () => screen.getByTestId('video-settings-title');
/** Whether a radio row shows its check mark: the row's only icon. */
const hasCheck = (testID: string): boolean => {
  type Node = { type?: unknown; children?: (Node | string)[] };
  const hasIcon = (node: Node | string): boolean =>
    typeof node !== 'string' &&
    ((typeof node.type === 'string' && node.type.startsWith('RNSVG')) || !!node.children?.some(hasIcon));
  return hasIcon(screen.getByTestId(testID) as unknown as Node);
};

const GoBackRow = () => {
  const { goBack } = useMenuContext();
  return (
    <Menu.Item testID="go-back" autoClose={false} onPress={() => goBack()}>
      Back
    </Menu.Item>
  );
};

const AUDIO: Track[] = [
  { index: 0, language: 'en', title: 'English' },
  { index: 1, language: 'ja', title: 'Japanese' },
];
const VIDEO: VideoTrackInfo[] = [
  { index: 0, width: 1280, height: 720, bitrate: 1 },
  { index: 1, width: 1920, height: 1080, bitrate: 2 },
];

beforeEach(() => {
  clearCaptionCache();
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => new TextEncoder().encode('WEBVTT\n\n00:00.000 --> 00:10.000\nHello').buffer,
  })) as unknown as typeof fetch;
});

describe('settings menu', () => {
  it('opens with the settings button on its first view, and closes with the close button', async () => {
    await setUp();
    expect(isOpen()).toBe(false);
    await openMenu();
    expect(isOpen()).toBe(true);
    expect(settings().isSettingsMenuVisible).toBe(true);
    expect(screen.getByTestId('video-settings-view-root')).toBeTruthy();
    expect(title()).toHaveTextContent('Settings');
    // Nothing to go back to on the first view
    expect(screen.queryByTestId('video-settings-back')).toBeNull();
    for (const row of ['audio', 'video', 'captions', 'rate']) {
      expect(screen.getByTestId(`video-settings-${row}`)).toBeTruthy();
    }
    await tap('video-settings-close');
    expect(isOpen()).toBe(false);
    expect(settings().isSettingsMenuVisible).toBe(false);
  });

  it('opens and closes from useSettings()', async () => {
    await setUp();
    await act(() => settings().openSettings());
    expect(isOpen()).toBe(true);
    await act(() => settings().closeSettings());
    expect(isOpen()).toBe(false);
    await act(() => settings().setSettingsMenuVisible(true));
    expect(isOpen()).toBe(true);
    await act(() => settings().setSettingsMenuVisible(false));
    expect(isOpen()).toBe(false);
  });

  it('goes into each view and back, and reopens on the first view', async () => {
    await setUp();
    await load({ audioTracks: AUDIO, videoTracks: VIDEO });
    await openMenu();
    for (const [row, view] of [
      ['audio', 'audio'],
      ['video', 'video'],
      ['captions', 'captions'],
      ['rate', 'playbackRate'],
    ] as const) {
      await press(`video-settings-${row}`);
      expect(screen.getByTestId(`video-settings-view-${view}`)).toBeTruthy();
      expect(screen.queryByTestId('video-settings-view-root')).toBeNull();
      await tap('video-settings-back');
      expect(screen.getByTestId('video-settings-view-root')).toBeTruthy();
    }
    await press('video-settings-audio');
    await tap('video-settings-close');
    await openMenu();
    expect(screen.getByTestId('video-settings-view-root')).toBeTruthy();
  });

  it('titles each view with the label of the row that opens it', async () => {
    await setUp();
    await openMenu();
    for (const [row, label] of [
      ['audio', 'Audio'],
      ['video', 'Video'],
      ['captions', 'Captions'],
      ['rate', 'Playback Rate'],
    ] as const) {
      expect(within(screen.getByTestId(`video-settings-${row}`)).getByText(label)).toBeTruthy();
      await press(`video-settings-${row}`);
      expect(title()).toHaveTextContent(label);
      await tap('video-settings-back');
    }
    expect(title()).toHaveTextContent('Settings');
  });

  it('picks an audio track', async () => {
    await setUp();
    await load({ audioTracks: AUDIO });
    await openMenu();
    expect(screen.getByTestId('video-settings-audio-value')).toHaveTextContent('English');
    await press('video-settings-audio');
    expect(screen.getByTestId('video-settings-audio-0')).toHaveTextContent('English');
    expect(hasCheck('video-settings-audio-0')).toBe(true);
    expect(hasCheck('video-settings-audio-1')).toBe(false);
    await press('video-settings-audio-1');
    expect(settings().audioTrack).toMatchObject({ index: 1, language: 'ja' });
    expect(hasCheck('video-settings-audio-1')).toBe(true);
    // A pick keeps the menu open on its view
    expect(screen.getByTestId('video-settings-view-audio')).toBeTruthy();
    await tap('video-settings-back');
    expect(screen.getByTestId('video-settings-audio-value')).toHaveTextContent('Japanese');
  });

  it('picks a video quality, and Auto again', async () => {
    await setUp();
    await load({ videoTracks: VIDEO });
    await openMenu();
    expect(screen.getByTestId('video-settings-video-value')).toHaveTextContent('Auto');
    await press('video-settings-video');
    expect(hasCheck('video-settings-video-auto')).toBe(true);
    expect(screen.getByTestId('video-settings-video-720p')).toHaveTextContent('720p');
    await press('video-settings-video-720p');
    expect(settings().videoTrack).toMatchObject({ height: 720 });
    expect(hasCheck('video-settings-video-720p')).toBe(true);
    expect(hasCheck('video-settings-video-auto')).toBe(false);
    await tap('video-settings-back');
    expect(screen.getByTestId('video-settings-video-value')).toHaveTextContent('720p');
    await press('video-settings-video');
    await press('video-settings-video-auto');
    expect(settings().videoTrack).toBeNull();
  });

  it('gives each quality its own test ID when heights repeat', async () => {
    const custom: CustomVideoTrack[] = [
      { height: 750, label: '750p SD' },
      { height: 750, label: '750p HD' },
    ];
    await setUp({ config: { useCustomVideoTracks: true }, customVideoTracks: custom });
    await load();
    await openMenu();
    await press('video-settings-video');
    expect(screen.getByTestId('video-settings-video-750p')).toHaveTextContent('750p SD');
    expect(screen.getByTestId('video-settings-video-750p-2')).toHaveTextContent('750p HD');
    // Both have the picked height, and the row picked last names it
    await press('video-settings-video-750p-2');
    await tap('video-settings-back');
    expect(screen.getByTestId('video-settings-video-value')).toHaveTextContent('750p HD');
  });

  it('picks a caption track, and Off', async () => {
    const source = {
      ...MOVIE,
      textTracks: [{ title: 'English', language: 'en', type: TextTrackType.VTT, uri: 'https://example.com/en.vtt' }],
    };
    await setUp({ source });
    await load({ textTracks: [{ index: 0, language: 'de', title: 'Deutsch' }] });
    await openMenu();
    expect(screen.getByTestId('video-settings-captions-value')).toHaveTextContent('English');
    await press('video-settings-captions');
    expect(screen.getByTestId('video-settings-captions-off')).toHaveTextContent('Off');
    expect(screen.getByTestId('video-settings-captions-0')).toHaveTextContent('Deutsch');
    expect(screen.getByTestId('video-settings-captions-1000')).toHaveTextContent('English');
    expect(hasCheck('video-settings-captions-1000')).toBe(true);
    await press('video-settings-captions-0');
    expect(settings().textTrack).toMatchObject({ index: 0 });
    await press('video-settings-captions-off');
    expect(settings().textTrack?.index).toBe(-1);
    expect(hasCheck('video-settings-captions-off')).toBe(true);
    await tap('video-settings-back');
    expect(screen.getByTestId('video-settings-captions-value')).toHaveTextContent('Off');
  });

  it('lists pinned caption tracks above Off, in their order', async () => {
    await setUp({ layout: { pinCaptionTrack: (track) => track.title === 'Added' } });
    await load({
      textTracks: [
        { index: 0, language: 'en', title: 'English' },
        { index: 1, language: 'fr', title: 'Added' },
      ],
    });
    await openMenu();
    await press('video-settings-captions');
    const rows = screen
      .getAllByTestId(/^video-settings-captions-(off|\d+)$/)
      .map((row) => row.props.testID.replace('video-settings-captions-', ''));
    expect(rows).toEqual(['1', 'off', '0']);
  });

  it('changes the playback rate, keeping the menu open on the rates', async () => {
    await setUp({ config: { playbackRates: [1, 1.5, 2] } });
    await openMenu();
    expect(screen.getByTestId('video-settings-rate-value')).toHaveTextContent('1x');
    await press('video-settings-rate');
    expect(screen.getByTestId('video-settings-rate-1.5')).toHaveTextContent('1.5x');
    expect(hasCheck('video-settings-rate-1')).toBe(true);
    await press('video-settings-rate-1.5');
    expect(video().playbackRate).toBe(1.5);
    expect(hasCheck('video-settings-rate-1.5')).toBe(true);
    // Choosing the current rate again leaves it
    await press('video-settings-rate-1.5');
    expect(video().playbackRate).toBe(1.5);
    expect(screen.getByTestId('video-settings-view-playbackRate')).toBeTruthy();
    await tap('video-settings-back');
    expect(screen.getByTestId('video-settings-rate-value')).toHaveTextContent('1.5x');
  });

  it('says when there is nothing to pick', async () => {
    await setUp({
      layout: {
        slots: {
          beforeCaptionTracks: <Text testID="before-captions">before</Text>,
          afterCaptionTracks: <Text testID="after-captions">after</Text>,
        },
      },
    });
    await openMenu();
    expect(screen.getByTestId('video-settings-audio-value')).toHaveTextContent('None');
    await press('video-settings-audio');
    expect(screen.getByText('No audio tracks available')).toBeTruthy();
    await tap('video-settings-back');
    // Without tracks of its own, the player still offers Auto
    await press('video-settings-video');
    expect(screen.getByTestId('video-settings-video-auto')).toBeTruthy();
    expect(screen.queryByText('No video tracks available')).toBeNull();
    await tap('video-settings-back');
    await press('video-settings-captions');
    expect(screen.getByText('No captions available')).toBeTruthy();
    expect(screen.getByTestId('before-captions')).toBeTruthy();
    expect(screen.getByTestId('after-captions')).toBeTruthy();
  });

  it('shows a custom quality list as it is, without an Auto row of its own', async () => {
    const custom: CustomVideoTrack[] = [
      { height: 0, label: 'Automatic' },
      { height: 720, label: '720p HD' },
    ];
    await setUp({ config: { useCustomVideoTracks: true }, customVideoTracks: custom });
    await load({ videoTracks: VIDEO });
    await openMenu();
    await press('video-settings-video');
    // The list's own entry with height 0 is its Auto
    expect(screen.getAllByTestId('video-settings-video-auto')).toHaveLength(1);
    expect(screen.getByTestId('video-settings-video-auto')).toHaveTextContent('Automatic');
    expect(screen.queryByTestId('video-settings-video-1080p')).toBeNull();
    expect(screen.getByTestId('video-settings-video-720p')).toHaveTextContent('720p HD');
    await press('video-settings-video-720p');
    expect(settings().videoTrack).toMatchObject({ label: '720p HD' });
  });

  it('says so when a custom quality list is empty', async () => {
    await setUp({ config: { useCustomVideoTracks: true }, customVideoTracks: [] });
    await load({ videoTracks: VIDEO });
    await openMenu();
    await press('video-settings-video');
    expect(screen.getByText('No video tracks available')).toBeTruthy();
    expect(screen.queryByTestId('video-settings-video-auto')).toBeNull();
  });

  it('renders the menu slots, and extra views titled by their id', async () => {
    const CloseRow = () => {
      const { closeSettings } = useMenuContext();
      return (
        <Menu.Item testID="servers-close" autoClose={false} onPress={() => closeSettings()}>
          Close it
        </Menu.Item>
      );
    };
    await setUp({
      layout: {
        slots: {
          beforeMenuItems: (
            <Menu.Item testID="video-settings-server" navigateTo="servers">
              <Text>Server</Text>
            </Menu.Item>
          ),
          afterMenuItems: <Text testID="after-items">after</Text>,
          menuViews: (
            <Menu.SubContent viewId="servers">
              <CloseRow />
            </Menu.SubContent>
          ),
        },
      },
    });
    await openMenu();
    expect(screen.getByTestId('after-items')).toBeTruthy();
    await press('video-settings-server');
    expect(screen.getByTestId('video-settings-view-servers')).toBeTruthy();
    // The header capitalizes it
    expect(title()).toHaveTextContent('servers');
    expect(screen.getByTestId('video-settings-back')).toBeTruthy();
    await press('servers-close');
    expect(isOpen()).toBe(false);
  });

  it('closes after a row without a view is pressed', async () => {
    await setUp({
      layout: {
        slots: { beforeMenuItems: <Menu.Item testID="plain-row">Plain</Menu.Item> },
      },
    });
    await openMenu();
    await press('plain-row');
    await waitFor(() => expect(isOpen()).toBe(false));
  });

  it('works as a menu of your own, opened by its trigger', async () => {
    const onChange = jest.fn();
    await setUp({
      children: (
        <Menu.Root>
          <Menu.Trigger />
          <Menu.Content>
            <Menu.SubContent viewId="root">
              <Menu.Label>Options</Menu.Label>
              <Menu.Separator />
              <Menu.Group>
                <Menu.Item testID="quality-row" navigateTo="quality">
                  Quality
                </Menu.Item>
                <GoBackRow />
              </Menu.Group>
            </Menu.SubContent>
            <Menu.SubContent viewId="quality">
              <Menu.CheckboxItem testID="hd" onCheckedChange={onChange}>
                HD
              </Menu.CheckboxItem>
            </Menu.SubContent>
          </Menu.Content>
        </Menu.Root>
      ),
    });
    await openMenu();
    expect(screen.getByText('Options')).toBeTruthy();
    await press('quality-row');
    expect(screen.getByTestId('video-settings-view-quality')).toBeTruthy();
    // Without `checked`, a checkbox keeps its own state
    expect(hasCheck('hd')).toBe(false);
    await press('hd');
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(hasCheck('hd')).toBe(true);
    expect(isOpen()).toBe(true);
    await press('hd');
    expect(onChange).toHaveBeenLastCalledWith(false);
    await tap('video-settings-back');
    expect(screen.getByTestId('video-settings-view-root')).toBeTruthy();
    // Going back from the first view closes the menu
    await press('go-back');
    expect(isOpen()).toBe(false);
  });

  it("names the parts after the player's testID", async () => {
    await render(
      <GestureHandlerRootView>
        <VideoProvider config={{ autoPlay: false }}>
          <VideoPlayer source={MOVIE} testID="main">
            <DefaultLayout />
          </VideoPlayer>
        </VideoProvider>
      </GestureHandlerRootView>
    );
    await tap('main-settings-button');
    expect(screen.getByTestId('main-settings')).toBeTruthy();
    expect(screen.getByTestId('main-settings-title')).toBeTruthy();
    await act(() => fireEvent.press(screen.getByTestId('main-settings-rate')));
    expect(screen.getByTestId('main-settings-rate-1.5')).toBeTruthy();
    expect(screen.getByTestId('main-settings-back')).toBeTruthy();
    expect(screen.getByTestId('main-settings-close')).toBeTruthy();
  });

  it('leaves the layout as it is while the menu opens and its settings change', async () => {
    await setUp({ layout: { title: 'Movie' } });
    await load({ audioTracks: AUDIO, videoTracks: VIDEO });
    // The title is a new element only when the layout renders
    const titleStyle = () => screen.getByTestId('video-title').props.style;
    const before = titleStyle();
    await openMenu();
    await press('video-settings-rate');
    await press('video-settings-rate-1.5');
    await tap('video-settings-back');
    await press('video-settings-audio');
    await press('video-settings-audio-1');
    await tap('video-settings-close');
    expect(titleStyle()).toBe(before);
    await act(() => handle.current!.video.dispatch({ type: 'SET_FULLSCREEN', payload: true }));
    expect(titleStyle()).not.toBe(before);
  });
});

describe('menus of your own', () => {
  const OwnMenu = ({ name, ...props }: { name: string } & Parameters<typeof Menu.Root>[0]) => (
    <Menu.Root {...props}>
      <Menu.Trigger testID={`${name}-button`} />
      <Menu.Content testID={name}>
        <Menu.SubContent viewId="root">
          <Menu.Item testID={`${name}-row`}>Row</Menu.Item>
        </Menu.SubContent>
      </Menu.Content>
    </Menu.Root>
  );

  it('open on their own, apart from each other and from the settings menu', async () => {
    await setUp({
      children: (
        <>
          <DefaultLayout />
          <OwnMenu name="first">{null}</OwnMenu>
          <OwnMenu name="second">{null}</OwnMenu>
        </>
      ),
    });
    await tap('first-button');
    expect(screen.queryByTestId('first')).not.toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(isOpen()).toBe(false);
    expect(settings().isSettingsMenuVisible).toBe(false);
    await press('first-row');
    await waitFor(() => expect(screen.queryByTestId('first')).toBeNull());
    await openMenu();
    expect(isOpen()).toBe(true);
    expect(screen.queryByTestId('first')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
  });

  it('can be controlled with open and onOpenChange', async () => {
    const onOpenChange = jest.fn();
    const Controlled = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <OwnMenu
          name="controlled"
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}>
          {null}
        </OwnMenu>
      );
    };
    await setUp({ children: <Controlled /> });
    await tap('controlled-button');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByTestId('controlled')).not.toBeNull();
    await tap('video-settings-close');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByTestId('controlled')).toBeNull();
  });

  it('title views by the row that opens them, and the first view by the menu', async () => {
    await setUp({
      children: (
        <Menu.Root title="Options">
          <Menu.Trigger />
          <Menu.Content>
            <Menu.SubContent viewId="root">
              <Menu.Item testID="speed-row" navigateTo="speed">
                Playback Speed
              </Menu.Item>
              <Menu.Item testID="quality-row" navigateTo="quality" title="Video quality">
                <Text>Quality</Text>
              </Menu.Item>
              <Menu.Item testID="more-row" navigateTo="moreOptions">
                <Text>More</Text>
              </Menu.Item>
            </Menu.SubContent>
          </Menu.Content>
        </Menu.Root>
      ),
    });
    await openMenu();
    expect(title()).toHaveTextContent('Options');
    for (const [row, heading] of [
      ['speed-row', 'Playback Speed'],
      ['quality-row', 'Video quality'],
      // Without a title, the view's id, which the header capitalizes
      ['more-row', 'more Options'],
    ]) {
      await press(row!);
      expect(title()).toHaveTextContent(heading!);
      await tap('video-settings-back');
    }
  });

  it('show the back button only with a view to go back to', async () => {
    await setUp({
      children: (
        <Menu.Root initialView="speed">
          <Menu.Trigger />
          <Menu.Content>
            <Menu.SubContent viewId="speed">
              <Menu.Item testID="more-row" navigateTo="more">
                More
              </Menu.Item>
            </Menu.SubContent>
          </Menu.Content>
        </Menu.Root>
      ),
    });
    await openMenu();
    expect(screen.getByTestId('video-settings-view-speed')).toBeTruthy();
    expect(screen.queryByTestId('video-settings-back')).toBeNull();
    await press('more-row');
    expect(screen.getByTestId('video-settings-back')).toBeTruthy();
  });

  it('mark radio rows for screen readers', async () => {
    const onSelect = jest.fn();
    await setUp({
      children: (
        <Menu.Root>
          <Menu.Trigger />
          <Menu.Content>
            <Menu.SubContent viewId="root">
              <Menu.RadioItem testID="on" selected onSelect={onSelect}>
                On
              </Menu.RadioItem>
              <Menu.RadioItem testID="off" selected={false} onSelect={onSelect}>
                Off
              </Menu.RadioItem>
            </Menu.SubContent>
          </Menu.Content>
        </Menu.Root>
      ),
    });
    await openMenu();
    expect(screen.getByTestId('on').props.accessibilityRole).toBe('radio');
    expect(screen.getByTestId('on').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('off').props.accessibilityState).toMatchObject({ checked: false });
    await press('off');
    expect(onSelect).toHaveBeenCalledTimes(1);
    // A pick keeps the menu open
    expect(isOpen()).toBe(true);
  });
});

describe('custom tracks', () => {
  const CUSTOM_AUDIO = [{ index: 7, language: 'fr', title: 'Français' }];
  const CUSTOM_VIDEO: CustomVideoTrack[] = [
    { height: 480, label: 'SD' },
    { height: 720, label: 'HD' },
  ];

  it('turn on with the props alone', async () => {
    await render(
      <GestureHandlerRootView>
        <VideoProvider config={{ autoPlay: false }}>
          <VideoPlayer source={MOVIE} customAudioTracks={CUSTOM_AUDIO} customVideoTracks={CUSTOM_VIDEO}>
            <Inspector handle={handle} />
            <DefaultLayout />
          </VideoPlayer>
        </VideoProvider>
      </GestureHandlerRootView>
    );
    await load({ audioTracks: AUDIO, videoTracks: VIDEO });
    expect(settings().audioTracks).toEqual(CUSTOM_AUDIO);
    expect(settings().videoTracks).toEqual(CUSTOM_VIDEO);
    await openMenu();
    await press('video-settings-video');
    // The app's list, without the player's Auto
    expect(screen.queryByTestId('video-settings-video-auto')).toBeNull();
    expect(screen.getByTestId('video-settings-video-480p')).toHaveTextContent('SD');
    expect(screen.getByTestId('video-settings-video-720p')).toHaveTextContent('HD');
  });

  it("offer Auto with the player's own qualities, whatever the deprecated flag says", async () => {
    await setUp({ config: { useCustomVideoTracks: true } });
    await load({ videoTracks: VIDEO });
    await openMenu();
    await press('video-settings-video');
    expect(screen.getByTestId('video-settings-video-auto')).toBeTruthy();
    expect(screen.getByTestId('video-settings-video-1080p')).toBeTruthy();
  });
});
