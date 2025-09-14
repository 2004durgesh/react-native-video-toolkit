import { View, StyleSheet, ScrollView } from 'react-native';
import { useBuffering, useControlsVisibility, useSettings } from '../hooks';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { type FC } from 'react';
import { useVideo } from '../providers';
import { Menu, Subtitle, Title, CommonLayoutStyles as layoutStyles, VideoPlayer } from '../components';
export interface DefaultLayoutProps {
  title?: string;
  subtitle?: string;
  slots?: {
    beforeSettingsButton?: React.ReactElement;
    afterSettingsButton?: React.ReactElement;
    beforeSubtitleToggleButton?: React.ReactElement;
    afterSubtitleToggleButton?: React.ReactElement;
    /**
     * Here, before is above the progress bar and after is below the progress bar.
     */
    beforeProgressBar?: React.ReactElement;
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
  subtitle,
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
          <View
            style={[layoutStyles.column, { justifyContent: 'space-between', height: '100%', paddingHorizontal: 15 }]}>
            <Animated.View
              style={[layoutStyles.topControls, topControlsAnimatedStyle, { padding: state.fullscreen ? 20 : 10 }]}>
              <View>
                {title && <Title text={title} />}
                {subtitle && <Subtitle text={subtitle} />}
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
                        <Menu.Item navigateTo="audio">
                          <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                            <Title text="Audio" />
                            <Subtitle text={audioTrack ? (audioTrack.title! ?? audioTrack.language!) : 'None'} />
                          </View>
                        </Menu.Item>
                        <Menu.Item navigateTo="video">
                          <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                            <Title text="Video" />
                            <Subtitle text={videoTrack ? videoTrack.height + 'p' : 'None'} />
                          </View>
                        </Menu.Item>
                        <Menu.Item navigateTo="captions">
                          <View style={[layoutStyles.row, { justifyContent: 'space-between' }]}>
                            <Title text="Captions" />
                            <Subtitle text={textTrack ? (textTrack.title! ?? textTrack.language!) : 'Off'} />
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
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAudioTrack(track);
                                  } else {
                                    setAudioTrack(null);
                                  }
                                }}>
                                {track.title ?? track.language}
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
                            {videoTracks.map((track) => (
                              <Menu.CheckboxItem
                                key={track.index}
                                checked={videoTrack?.index === track.index}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setVideoTrack(track);
                                  } else {
                                    setVideoTrack(null);
                                  }
                                }}>
                                {track.height}p
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
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setTextTrack(track);
                                  } else {
                                    setTextTrack(null);
                                  }
                                }}>
                                {track.title ?? track.language}
                              </Menu.CheckboxItem>
                            ))}
                          </ScrollView>
                        ) : (
                          <View style={{ padding: 10 }}>
                            <Subtitle text="No captions available" />
                          </View>
                        )}
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
                  <VideoPlayer.PlayButton size={state.theme.iconSizes.md} />
                  {slots?.afterCenterPlayButton && slots.afterCenterPlayButton}
                </View>
              ) : null}
            </Animated.View>
            <Animated.View
              style={[
                layoutStyles.bottomControls,
                bottomControlsAnimatedStyle,
                { padding: state.fullscreen ? 20 : 10 },
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
