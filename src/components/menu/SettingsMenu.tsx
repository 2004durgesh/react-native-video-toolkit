import React, { type ComponentType, type ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { TextTrack } from 'react-native-video';
import { usePlaybackRate, useSettings } from '../../hooks';
import { useSettingsContext, useVideoSelector } from '../../providers';
import { usePlayerTestID } from '../../utils/testIDs';
import { trackLabel, videoTrackLabel } from '../../tracks/labels';
import { isOffTrack, isSelectedVideoTrack } from '../../tracks/selection';
import { Audio, Quality, Speed, Subtitles } from '../svgs';
import { Subtitle, Title } from '../display';
import { Menu } from './Menu';
import type { IconProps } from '../../types/svg';

/** Rows and views added to the settings menu: `DefaultLayout`'s menu slots. */
export interface SettingsMenuSlots {
  beforeMenuItems?: ReactElement;
  afterMenuItems?: ReactElement;
  beforeCaptionTracks?: ReactElement;
  afterCaptionTracks?: ReactElement;
  menuViews?: ReactElement;
}

export interface SettingsMenuProps {
  /** Caption tracks it returns `true` for are listed first, above "Off". */
  pinCaptionTrack?: (track: TextTrack) => boolean;
  slots?: SettingsMenuSlots;
}

/** One choice in a section's list. */
interface SettingsOption {
  /** Its part of the row's test ID: `1.5` in `video-settings-rate-1.5`. */
  id: string;
  label: string;
  selected: boolean;
  select: () => void;
}

/** A row of the menu's first view, and the list of choices it opens. */
interface SettingsSection {
  /** The view the row opens. */
  view: string;
  /** Its part of the test IDs: `rate` in `video-settings-rate` and `video-settings-rate-1.5`. */
  id: string;
  /** The row's label, and the title of the view it opens. */
  label: string;
  icon: ComponentType<IconProps>;
  /** The current choice, shown on the row. */
  value: string;
  options: SettingsOption[];
  /** What the view says when there's nothing to choose. */
  empty: string;
  /** Rows above and below the choices, or the empty state. */
  before?: ReactElement;
  after?: ReactElement;
}

/**
 * Each quality's part of its `testID`: its height (`750p`), or `auto` for a custom list's entry with
 * height 0. A height listed again, or one already `taken`, gets `-2`, `-3`... so every row has its
 * own ID.
 */
const videoTrackTestIDs = (tracks: { height?: number }[], taken: string[]): string[] => {
  const seen = new Map(taken.map((id) => [id, 1]));
  return tracks.map((track) => {
    const base = track.height ? `${track.height}p` : 'auto';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  });
};

/** The settings menu's sections, from the player's tracks, its rate and the rates it offers. */
const useSettingsSections = ({ pinCaptionTrack, slots }: SettingsMenuProps): SettingsSection[] => {
  const {
    audioTrack,
    audioTracks,
    setAudioTrack,
    videoTrack,
    videoTracks,
    setVideoTrack,
    textTrack,
    textTracks,
    setTextTrack,
  } = useSettings();
  const customVideoList = useSettingsContext().state.isCustomVideoList;
  const { playbackRate, setPlaybackRate } = usePlaybackRate();
  const playbackRates = useVideoSelector((state) => state.config.playbackRates);

  const videoOptionIDs = videoTrackTestIDs(videoTracks, customVideoList ? [] : ['auto']);
  // Pinned tracks go above "Off", which leads the rest
  const captionTracks = pinCaptionTrack
    ? [...textTracks.filter(pinCaptionTrack), ...textTracks.filter((track) => !pinCaptionTrack(track))]
    : textTracks;

  return [
    {
      view: 'audio',
      id: 'audio',
      label: 'Audio',
      icon: Audio,
      value: audioTrack ? trackLabel(audioTrack) : 'None',
      options: audioTracks.map((track) => ({
        id: String(track.index),
        label: trackLabel(track),
        selected: audioTrack?.index === track.index,
        select: () => setAudioTrack(track),
      })),
      empty: 'No audio tracks available',
    },
    {
      view: 'video',
      id: 'video',
      label: 'Video',
      icon: Quality,
      value: videoTrack ? videoTrackLabel(videoTrack) : 'Auto',
      options: [
        // Adaptive quality, the default. A custom list brings its own "Auto" entry if it wants one.
        ...(customVideoList
          ? []
          : [{ id: 'auto', label: 'Auto', selected: !videoTrack, select: () => setVideoTrack(null) }]),
        ...videoTracks.map((track, i) => ({
          id: videoOptionIDs[i]!,
          label: videoTrackLabel(track),
          selected: isSelectedVideoTrack(videoTrack, track),
          select: () => setVideoTrack(track),
        })),
      ],
      empty: 'No video tracks available',
    },
    {
      view: 'captions',
      id: 'captions',
      label: 'Captions',
      icon: Subtitles,
      value: textTrack ? trackLabel(textTrack) : 'Off',
      options: captionTracks.map((track) => ({
        id: isOffTrack(track) ? 'off' : String(track.index),
        label: trackLabel(track),
        selected: textTrack?.index === track.index,
        select: () => setTextTrack(track),
      })),
      empty: 'No captions available',
      before: slots?.beforeCaptionTracks,
      after: slots?.afterCaptionTracks,
    },
    {
      view: 'playbackRate',
      id: 'rate',
      label: 'Playback Rate',
      icon: Speed,
      value: `${playbackRate}x`,
      options: playbackRates.map((rate) => ({
        id: String(rate),
        label: `${rate}x`,
        selected: playbackRate === rate,
        select: () => setPlaybackRate(rate),
      })),
      empty: 'No playback rates available',
    },
  ];
};

/** A row of the first view: the section's icon and label, and its current choice. */
const SettingsRow = ({ section, testID }: { section: SettingsSection; testID: string }): ReactElement => {
  const color = useVideoSelector((state) => state.theme.colors.menuText);
  const iconSize = useVideoSelector((state) => state.theme.iconSizes.sm);
  const Icon = section.icon;
  return (
    <Menu.Item navigateTo={section.view} title={section.label} testID={testID}>
      <View style={[styles.row, styles.spread]}>
        <View style={[styles.row, styles.rowLabel]}>
          <Icon size={iconSize} color={color} shadow={false} />
          <Title text={section.label} />
        </View>
        <Subtitle text={section.value} testID={`${testID}-value`} />
      </View>
    </Menu.Item>
  );
};

/** A section's choices, one of them picked, or what it says when there are none. */
const OptionList = ({ section, testID }: { section: SettingsSection; testID: string }): ReactElement =>
  section.options.length > 0 ? (
    <ScrollView style={styles.list}>
      {section.before}
      {section.options.map((option) => (
        <Menu.RadioItem
          key={option.id}
          testID={`${testID}-${option.id}`}
          selected={option.selected}
          onSelect={option.select}>
          {option.label}
        </Menu.RadioItem>
      ))}
      {section.after}
    </ScrollView>
  ) : (
    <>
      {section.before}
      <View style={styles.empty}>
        <Subtitle text={section.empty} />
      </View>
      {section.after}
    </>
  );

/**
 * Renders the settings button and the settings menu it opens.
 *
 * The menu lists audio, video quality, captions and playback rate, each opening its list, and is
 * open while `useSettings().isSettingsMenuVisible` is. It reads the settings itself, so the layout
 * around it doesn't re-render as they change. Its test IDs start with the player's:
 * `video-settings-rate`, `video-settings-rate-1.5`.
 *
 * @param {SettingsMenuProps} props - The caption tracks to pin, and the rows and views to add.
 * @returns {React.ReactElement} The settings button and its menu.
 * @internal
 */
export const SettingsMenu = ({ pinCaptionTrack, slots }: SettingsMenuProps): ReactElement => {
  const { isSettingsMenuVisible, setSettingsMenuVisible } = useSettings();
  const sections = useSettingsSections({ pinCaptionTrack, slots });
  const id = usePlayerTestID();

  return (
    <Menu.Root open={isSettingsMenuVisible} onOpenChange={setSettingsMenuVisible}>
      <Menu.Trigger />
      <Menu.Content>
        <Menu.SubContent viewId="root">
          {slots?.beforeMenuItems}
          {sections.map((section) => (
            <SettingsRow key={section.view} section={section} testID={`${id}-settings-${section.id}`} />
          ))}
          {slots?.afterMenuItems}
        </Menu.SubContent>
        {sections.map((section) => (
          <Menu.SubContent key={section.view} viewId={section.view}>
            <OptionList section={section} testID={`${id}-settings-${section.id}`} />
          </Menu.SubContent>
        ))}
        {slots?.menuViews}
      </Menu.Content>
    </Menu.Root>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  spread: { justifyContent: 'space-between' },
  rowLabel: { gap: 12 },
  list: { maxHeight: '100%' },
  empty: { padding: 10 },
});
