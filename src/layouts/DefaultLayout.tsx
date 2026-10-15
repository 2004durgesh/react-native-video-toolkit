import { View, StyleSheet, ScrollView, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { useSettings, usePlaybackRate, usePictureInPicture } from '../hooks';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { type FC, type ReactNode } from 'react';
import { DevProfiler } from '../utils/DevProfiler';
import { useVideoSelector } from '../providers';
import {
  Menu,
  Subtitle,
  Title,
  CommonLayoutStyles as layoutStyles,
  VideoPlayer,
  type TitleProps,
  type SubitleProps,
  Audio,
  Quality,
  Speed,
  Subtitles,
} from '../components';
import { PlatformUtils } from '../utils/platform';
export interface DefaultLayoutProps {
  scrim?: boolean | ColorValue;
  title?: string;
  titleProps?: Omit<TitleProps, 'text'>;
  subtitle?: string;
  subtitleProps?: Omit<SubitleProps, 'text'>;
  slots?: {
    beforeTitle?: React.ReactElement;
    beforeSettingsButton?: React.ReactElement;
    afterSettingsButton?: React.ReactElement;
    beforeSubtitleToggleButton?: React.ReactElement;
    afterSubtitleToggleButton?: React.ReactElement;
    /**
     * Here, before is above the progress bar
     */
    beforeProgressBar?: React.ReactElement;
    /**
     * Here, after is below the progress bar
     */
    afterProgressBar?: React.ReactElement;
    beforeTimeDisplay?: React.ReactElement;
    afterTimeDisplay?: React.ReactElement;
    beforeMuteButton?: React.ReactElement;
    afterMuteButton?: React.ReactElement;
    beforePictureInPictureButton?: React.ReactElement;
    afterPictureInPictureButton?: React.ReactElement;
    beforeFullscreenButton?: React.ReactElement;
    afterFullscreenButton?: React.ReactElement;
    beforeCenterPlayButton?: React.ReactElement;
    afterCenterPlayButton?: React.ReactElement;
  };
}

/**
 * Whether `track` is the selected one. The player's own tracks compare by index; custom tracks
 * usually have no index, which made every row look selected, so they compare by height.
 */
const isSelectedVideoTrack = (
  selected: { index?: number; height?: number } | null,
  track: { index?: number; height?: number }
) => {
  if (!selected) return false;
  if (selected.index !== undefined && track.index !== undefined) return selected.index === track.index;
  return selected.height === track.height;
};

const touchStyles = StyleSheet.create({
  passThrough: { pointerEvents: 'box-none' },
  none: { pointerEvents: 'none' },
});

/**
 * Fades and slides a group of controls with the controls' visibility. These wrappers are the only
 * part of the layout that reads `controlsVisible`, so a tap re-renders them but not the controls
 * inside: those are elements the layout already created.
 */
const FadingControls = ({
  offsetY = 0,
  showWhileBuffering = false,
  style,
  children,
}: {
  /** How far the group slides out when hidden. */
  offsetY?: number;
  /** Keep it visible while buffering, for the centre controls. */
  showWhileBuffering?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) => {
  const controlsVisible = useVideoSelector((state) => state.controlsVisible);
  const buffering = useVideoSelector((state) => showWhileBuffering && state.buffering);
  const visible = controlsVisible || buffering;
  const animatedStyle = useAnimatedStyle(() => {
    const easing = Easing.bezierFn(0.25, 0.1, 0.25, 1);
    return {
      opacity: withTiming(visible ? 1 : 0, { duration: 100, easing }),
      transform: [{ translateY: withTiming(visible ? 0 : offsetY, { duration: 100, easing }) }],
    };
  }, [visible, offsetY]);

  // Faded-out controls stay mounted, so stop them taking touches: a tap meant to bring the controls back (or a swipe
  // starting near an edge) would otherwise hit an invisible button or the progress bar
  return (
    <Animated.View style={[style, animatedStyle, controlsVisible ? touchStyles.passThrough : touchStyles.none]}>
      {children}
    </Animated.View>
  );
};

/** Renders the children only while not buffering, reading `buffering` itself so the layout doesn't. */
const UnlessBuffering = ({ children }: { children: ReactNode }) => {
  const buffering = useVideoSelector((state) => state.buffering);
  return buffering ? null : <>{children}</>;
};

/** Renders the children only while buffering. */
const WhileBuffering = ({ children }: { children: ReactNode }) => {
  const buffering = useVideoSelector((state) => state.buffering);
  return buffering ? <>{children}</> : null;
};

/**
 * A predefined layout for the video player.
 *
 * @param {DefaultLayoutProps} props - The props for the component.
 * @returns {React.ReactElement} The default layout component.
 */
export const DefaultLayout: FC<DefaultLayoutProps> = ({
  scrim = true,
  title,
  titleProps,
  subtitle,
  subtitleProps,
  slots,
}: DefaultLayoutProps): React.ReactElement => {
  const theme = useVideoSelector((state) => state.theme);
  const config = useVideoSelector((state) => state.config);
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  const {
    videoTracks,
    textTracks,
    audioTracks,
    videoTrack,
    textTrack,
    audioTrack,
    setVideoTrack,
    setTextTrack,
    setAudioTrack,
  } = useSettings();
  const { playbackRate, setPlaybackRate } = usePlaybackRate();
  const { supported: pictureInPictureSupported } = usePictureInPicture();

  const showPictureInPictureButton =
    config.enablePictureInPicture && pictureInPictureSupported && !PlatformUtils.isTV();

  return (
    <DevProfiler id="DefaultLayout">
      <>
        <Animated.View style={[styles.baseStyle, { pointerEvents: 'box-none' }]}>
          {scrim ? <VideoPlayer.Overlay withControls scrim={scrim} pointerEvents="none" /> : null}
          <VideoPlayer.Controls>
            <View style={[layoutStyles.column, { height: '100%', paddingHorizontal: 15 }]}>
              <FadingControls
                offsetY={-50}
                style={[
                  layoutStyles.topControls,
                  layoutStyles.row,
                  { padding: fullscreen ? 20 : 10, justifyContent: 'space-between' },
                ]}>
                <View style={[layoutStyles.row, styles.titleRow]}>
                  {slots?.beforeTitle && slots.beforeTitle}
                  <View style={styles.titleColumn}>
                    {title && <Title text={title} {...titleProps} />}
                    {subtitle && <Subtitle text={subtitle} {...subtitleProps} />}
                  </View>
                </View>
                <View style={[layoutStyles.row]}>
                  <View style={[layoutStyles.row]}>
                    {slots?.beforeSubtitleToggleButton && slots.beforeSubtitleToggleButton}
                    <VideoPlayer.SubtitleToggleButton />
                    {slots?.afterSubtitleToggleButton && slots.afterSubtitleToggleButton}
                  </View>
                  <View style={[layoutStyles.row]}>
                    {slots?.beforeSettingsButton && slots.beforeSettingsButton}
                    <DevProfiler id="Menu">
                      <Menu.Root>
                        <Menu.Trigger />
                        <Menu.Content>
                          <Menu.SubContent viewId="root">
                            <Menu.Item navigateTo="audio">
                              <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                                <View style={[layoutStyles.row, styles.menuRowLabel]}>
                                  <Audio size={theme.iconSizes.sm} color={theme.colors.menuText} shadow={false} />
                                  <Title text="Audio" />
                                </View>
                                <Subtitle text={audioTrack ? audioTrack.title || audioTrack.language || '' : 'None'} />
                              </View>
                            </Menu.Item>
                            <Menu.Item navigateTo="video">
                              <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                                <View style={[layoutStyles.row, styles.menuRowLabel]}>
                                  <Quality size={theme.iconSizes.sm} color={theme.colors.menuText} shadow={false} />
                                  <Title text="Video" />
                                </View>
                                <Subtitle
                                  text={videoTrack ? (videoTrack as any).label || videoTrack.height + 'p' : 'Auto'}
                                />
                              </View>
                            </Menu.Item>
                            <Menu.Item navigateTo="captions">
                              <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                                <View style={[layoutStyles.row, styles.menuRowLabel]}>
                                  <Subtitles size={theme.iconSizes.sm} color={theme.colors.menuText} shadow={false} />
                                  <Title text="Captions" />
                                </View>
                                <Subtitle text={textTrack ? textTrack.title || textTrack.language || '' : 'Off'} />
                              </View>
                            </Menu.Item>
                            <Menu.Item navigateTo="playbackRate">
                              <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                                <View style={[layoutStyles.row, styles.menuRowLabel]}>
                                  <Speed size={theme.iconSizes.sm} color={theme.colors.menuText} shadow={false} />
                                  <Title text="Rate" />
                                </View>
                                <Subtitle text={`${playbackRate}x`} />
                              </View>
                            </Menu.Item>
                          </Menu.SubContent>
                          <Menu.SubContent viewId="audio">
                            {audioTracks.length > 0 ? (
                              <ScrollView style={{ maxHeight: '100%' }}>
                                {audioTracks.map((track) => (
                                  <Menu.CheckboxItem
                                    key={track.index}
                                    checked={audioTrack?.index === track.index}
                                    onCheckedChange={() => {
                                      setAudioTrack(track);
                                    }}>
                                    {track.title || track.language}
                                  </Menu.CheckboxItem>
                                ))}
                              </ScrollView>
                            ) : (
                              <View style={{ padding: 10 }}>
                                <Subtitle text="No audio tracks available" />
                              </View>
                            )}
                          </Menu.SubContent>
                          <Menu.SubContent viewId="video">
                            {videoTracks.length > 0 || !config.useCustomVideoTracks ? (
                              <ScrollView style={{ maxHeight: '100%' }}>
                                {/* Adaptive quality, the default. A custom list brings its own "Auto" entry if it wants one. */}
                                {!config.useCustomVideoTracks && (
                                  <Menu.CheckboxItem checked={!videoTrack} onCheckedChange={() => setVideoTrack(null)}>
                                    Auto
                                  </Menu.CheckboxItem>
                                )}
                                {videoTracks.map((track) => (
                                  <Menu.CheckboxItem
                                    key={`${track.width}x${track.height}-${track.codecs ?? ''}-${track.index ?? ''}`}
                                    checked={isSelectedVideoTrack(videoTrack, track)}
                                    onCheckedChange={() => {
                                      setVideoTrack(track);
                                    }}>
                                    {(track as any).label || track.height + 'p'}
                                  </Menu.CheckboxItem>
                                ))}
                              </ScrollView>
                            ) : (
                              <View style={{ padding: 10 }}>
                                <Subtitle text="No video tracks available" />
                              </View>
                            )}
                          </Menu.SubContent>
                          <Menu.SubContent viewId="captions">
                            {textTracks.length > 0 ? (
                              <ScrollView style={{ maxHeight: '100%' }}>
                                {textTracks.map((track) => (
                                  <Menu.CheckboxItem
                                    key={track.index}
                                    checked={textTrack?.index === track.index}
                                    onCheckedChange={() => {
                                      setTextTrack(track);
                                    }}>
                                    {track.title || track.language}
                                  </Menu.CheckboxItem>
                                ))}
                              </ScrollView>
                            ) : (
                              <View style={{ padding: 10 }}>
                                <Subtitle text="No captions available" />
                              </View>
                            )}
                          </Menu.SubContent>
                          <Menu.SubContent viewId="playbackRate">
                            <ScrollView style={{ maxHeight: '100%' }}>
                              {config.playbackRates.map((rate) => (
                                <Menu.CheckboxItem
                                  key={rate}
                                  checked={playbackRate === rate}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setPlaybackRate(rate);
                                    }
                                  }}>
                                  {rate}x
                                </Menu.CheckboxItem>
                              ))}
                            </ScrollView>
                          </Menu.SubContent>
                        </Menu.Content>
                      </Menu.Root>
                    </DevProfiler>
                    {slots?.afterSettingsButton && slots.afterSettingsButton}
                  </View>
                </View>
              </FadingControls>
              {/* The full-size, pass-through overlay is a plain View: on web, reanimated inlines an
                animated view's styles and drops `pointerEvents: 'box-none'`, so the overlay would
                swallow taps meant for the top and bottom controls. */}
              <View style={layoutStyles.centerControls}>
                <FadingControls showWhileBuffering>
                  <UnlessBuffering>
                    <View style={layoutStyles.row}>
                      {slots?.beforeCenterPlayButton && slots.beforeCenterPlayButton}
                      <DevProfiler id="PlayButton">
                        <VideoPlayer.PlayButton size={theme.iconSizes.lg} />
                      </DevProfiler>
                      {slots?.afterCenterPlayButton && slots.afterCenterPlayButton}
                    </View>
                  </UnlessBuffering>
                </FadingControls>
              </View>
              <FadingControls
                offsetY={50}
                style={[
                  layoutStyles.bottomControls,
                  {
                    padding: fullscreen ? 20 : 10,
                  },
                ]}>
                <View style={[layoutStyles.column]}>
                  {slots?.beforeProgressBar && slots.beforeProgressBar}
                  <DevProfiler id="ProgressBar">
                    <VideoPlayer.ProgressBar />
                  </DevProfiler>
                  {slots?.afterProgressBar && slots.afterProgressBar}
                </View>
                <View style={layoutStyles.row}>
                  <View style={layoutStyles.row}>
                    {slots?.beforeTimeDisplay && slots.beforeTimeDisplay}
                    <DevProfiler id="TimeDisplay">
                      <VideoPlayer.TimeDisplay />
                    </DevProfiler>
                    {slots?.afterTimeDisplay && slots.afterTimeDisplay}
                  </View>
                  <View style={layoutStyles.spacer} />
                  <View style={[layoutStyles.row]}>
                    {showPictureInPictureButton && (
                      <View style={[layoutStyles.row]}>
                        {slots?.beforePictureInPictureButton && slots.beforePictureInPictureButton}
                        <VideoPlayer.PictureInPictureButton />
                        {slots?.afterPictureInPictureButton && slots.afterPictureInPictureButton}
                      </View>
                    )}
                    <View style={[layoutStyles.row]}>
                      {slots?.beforeFullscreenButton && slots.beforeFullscreenButton}
                      {config.enableFullscreen && <VideoPlayer.FullscreenButton />}
                      {slots?.afterFullscreenButton && slots.afterFullscreenButton}
                    </View>
                    <View style={[layoutStyles.row]}>
                      {slots?.beforeMuteButton && slots.beforeMuteButton}
                      <VideoPlayer.MuteButton />
                      {slots?.afterMuteButton && slots.afterMuteButton}
                    </View>
                  </View>
                </View>
              </FadingControls>
            </View>
          </VideoPlayer.Controls>
        </Animated.View>
        {/* Separate loading spinner that's always visible when buffering */}
        <WhileBuffering>
          <View style={[styles.baseStyle, { pointerEvents: 'none' }]}>
            <VideoPlayer.LoadingSpinner />
          </View>
        </WhileBuffering>
      </>
    </DevProfiler>
  );
};

const styles = StyleSheet.create({
  baseStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  menuRowLabel: {
    gap: 12,
  },
  titleRow: {
    flexShrink: 1,
    gap: 8,
  },
  titleColumn: {
    flexShrink: 1,
  },
});
