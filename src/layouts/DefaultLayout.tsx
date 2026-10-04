import { View, StyleSheet, ScrollView } from 'react-native';
import { useBuffering, useControlsVisibility, useSettings, usePlaybackRate } from '../hooks';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { type FC } from 'react';
import type { AudioTrack, TextTrack, VideoTrack } from 'react-native-video';
import { useVideo } from '../providers';
import type { CustomVideoTrack } from '../types';

/** Menu label for an audio or text track. */
const trackLabel = (track: AudioTrack | TextTrack): string => track.label || track.language || 'Unknown';

/** Menu label for a quality track; custom tracks may only provide a height. */
const videoTrackLabel = (track: CustomVideoTrack | VideoTrack): string =>
  track.label || ('height' in track && track.height ? `${track.height}p` : 'Auto');

/** Tracks match by id when they have one (custom tracks may not), otherwise by identity. */
const isSameTrack = <T extends { id?: string }>(selected: T | null, track: T): boolean =>
  selected === track || (selected?.id !== undefined && selected.id === track.id);
import {
  Menu,
  Subtitle,
  Title,
  CommonLayoutStyles as layoutStyles,
  VideoPlayer,
  type TitleProps,
  type SubitleProps,
} from '../components';
export interface DefaultLayoutProps {
  title?: string;
  titleProps?: Omit<TitleProps, 'text'>;
  subtitle?: string;
  subtitleProps?: Omit<SubitleProps, 'text'>;
  slots?: {
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
    beforeFullscreenButton?: React.ReactElement;
    afterFullscreenButton?: React.ReactElement;
    beforeCenterPlayButton?: React.ReactElement;
    afterCenterPlayButton?: React.ReactElement;
  };
}

/**
 * A predefined layout for the video player.
 *
 * @param {DefaultLayoutProps} props - The props for the component.
 * @returns {React.ReactElement} The default layout component.
 */
export const DefaultLayout: FC<DefaultLayoutProps> = ({
  title,
  titleProps,
  subtitle,
  subtitleProps,
  slots,
}: DefaultLayoutProps): React.ReactElement => {
  const { buffering } = useBuffering();
  const { state } = useVideo();
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
  const { controlsVisible } = useControlsVisibility();
  const { playbackRate, setPlaybackRate } = usePlaybackRate();
  const topControlsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(controlsVisible ? 1 : 0, { duration: 100, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) }),
      transform: [
        {
          translateY: withTiming(controlsVisible ? 0 : -50, {
            duration: 100,
            easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  }, [controlsVisible]);

  const bottomControlsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(controlsVisible ? 1 : 0, { duration: 100, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) }),
      transform: [
        {
          translateY: withTiming(controlsVisible ? 0 : 50, {
            duration: 100,
            easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  }, [controlsVisible]);

  const centerControlsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(controlsVisible || buffering ? 1 : 0, {
        duration: 100,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      }),
      // Keep position absolute and translate for centering
    };
  }, [controlsVisible, buffering]);
  return (
    <>
      <Animated.View style={[styles.baseStyle, { pointerEvents: 'box-none' }]}>
        <VideoPlayer.Controls>
          <View style={[layoutStyles.column, { height: '100%', paddingHorizontal: 15 }]}>
            <Animated.View
              style={[
                layoutStyles.topControls,
                layoutStyles.row,
                topControlsAnimatedStyle,
                { padding: state.fullscreen ? 20 : 10, justifyContent: 'space-between' },
              ]}>
              <View>
                {title && <Title text={title} {...titleProps} />}
                {subtitle && <Subtitle text={subtitle} {...subtitleProps} />}
              </View>
              <View style={[layoutStyles.row]}>
                <View style={[layoutStyles.row]}>
                  {slots?.beforeSubtitleToggleButton && slots.beforeSubtitleToggleButton}
                  <VideoPlayer.SubtitleToggleButton />
                  {slots?.afterSubtitleToggleButton && slots.afterSubtitleToggleButton}
                </View>
                <View style={[layoutStyles.row]}>
                  {slots?.beforeSettingsButton && slots.beforeSettingsButton}
                  <Menu.Root>
                    <Menu.Trigger />
                    <Menu.Content>
                      <Menu.SubContent viewId="root">
                        {/* Audio/quality selection is only available where the player supports it (web). */}
                        {audioTracks.length > 0 && (
                          <Menu.Item navigateTo="audio">
                            <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                              <Title text="Audio" />
                              <Subtitle text={audioTrack ? trackLabel(audioTrack) : 'None'} />
                            </View>
                          </Menu.Item>
                        )}
                        {videoTracks.length > 0 && (
                          <Menu.Item navigateTo="video">
                            <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                              <Title text="Video" />
                              <Subtitle text={videoTrack ? videoTrackLabel(videoTrack) : 'None'} />
                            </View>
                          </Menu.Item>
                        )}
                        <Menu.Item navigateTo="captions">
                          <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                            <Title text="Captions" />
                            <Subtitle text={textTrack ? trackLabel(textTrack) : 'Off'} />
                          </View>
                        </Menu.Item>
                        <Menu.Item navigateTo="playbackRate">
                          <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                            <Title text="Rate" />
                            <Subtitle text={`${playbackRate}x`} />
                          </View>
                        </Menu.Item>
                      </Menu.SubContent>
                      <Menu.SubContent viewId="audio">
                        {audioTracks.length > 0 ? (
                          <ScrollView style={{ maxHeight: '100%' }}>
                            {audioTracks.map((track) => (
                              <Menu.CheckboxItem
                                key={track.id}
                                checked={isSameTrack(audioTrack, track)}
                                onCheckedChange={() => {
                                  setAudioTrack(track);
                                }}>
                                {trackLabel(track)}
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
                        {videoTracks.length > 0 ? (
                          <ScrollView style={{ maxHeight: '100%' }}>
                            {videoTracks.map((track, i) => (
                              <Menu.CheckboxItem
                                key={track.id ?? `${videoTrackLabel(track)}-${i}`}
                                checked={isSameTrack(videoTrack, track)}
                                onCheckedChange={() => {
                                  setVideoTrack(track);
                                }}>
                                {videoTrackLabel(track)}
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
                            <Menu.CheckboxItem
                              checked={!textTrack}
                              onCheckedChange={() => {
                                setTextTrack(null);
                              }}>
                              Off
                            </Menu.CheckboxItem>
                            {textTracks.map((track) => (
                              <Menu.CheckboxItem
                                key={track.id}
                                checked={isSameTrack(textTrack, track)}
                                onCheckedChange={() => {
                                  setTextTrack(track);
                                }}>
                                {trackLabel(track)}
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
                          {state.config.playbackRates.map((rate) => (
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
                  {slots?.afterSettingsButton && slots.afterSettingsButton}
                </View>
              </View>
            </Animated.View>
            <Animated.View style={[centerControlsAnimatedStyle, layoutStyles.centerControls]}>
              {!buffering ? (
                <View style={layoutStyles.row}>
                  {slots?.beforeCenterPlayButton && slots.beforeCenterPlayButton}
                  <VideoPlayer.PlayButton size={state.theme.iconSizes.lg} />
                  {slots?.afterCenterPlayButton && slots.afterCenterPlayButton}
                </View>
              ) : null}
            </Animated.View>
            <Animated.View
              style={[
                layoutStyles.bottomControls,
                bottomControlsAnimatedStyle,
                {
                  padding: state.fullscreen ? 20 : 10,
                },
              ]}>
              <View style={[layoutStyles.column]}>
                {slots?.beforeProgressBar && slots.beforeProgressBar}
                <VideoPlayer.ProgressBar />
                {slots?.afterProgressBar && slots.afterProgressBar}
              </View>
              <View style={layoutStyles.row}>
                <View style={layoutStyles.row}>
                  {slots?.beforeTimeDisplay && slots.beforeTimeDisplay}
                  <VideoPlayer.TimeDisplay />
                  {slots?.afterTimeDisplay && slots.afterTimeDisplay}
                </View>
                <View style={layoutStyles.spacer} />
                <View style={[layoutStyles.row]}>
                  <View style={[layoutStyles.row]}>
                    {slots?.beforeFullscreenButton && slots.beforeFullscreenButton}
                    <VideoPlayer.FullscreenButton />
                    {slots?.afterFullscreenButton && slots.afterFullscreenButton}
                  </View>
                  <View style={[layoutStyles.row]}>
                    {slots?.beforeMuteButton && slots.beforeMuteButton}
                    <VideoPlayer.MuteButton />
                    {slots?.afterMuteButton && slots.afterMuteButton}
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </VideoPlayer.Controls>
      </Animated.View>
      {/* Separate loading spinner that's always visible when buffering */}
      {buffering && (
        <View style={[styles.baseStyle, { pointerEvents: 'none' }]}>
          <VideoPlayer.LoadingSpinner />
        </View>
      )}
    </>
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
});
