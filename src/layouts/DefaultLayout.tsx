import { View, StyleSheet, ScrollView } from 'react-native';
import { useBuffering, useControlsVisibility, useSettings } from '../hooks';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useEffect, type FC } from 'react';
import { useVideo } from '../providers';
import { Menu, Subtitle, Title, CommonLayoutStyles as layoutStyles, VideoPlayer } from '../components';
export interface DefaultLayoutProps {
  title?: string;
  subtitle?: string;
}

/**
 * A predefined layout for the video player.
 *
 * @param {DefaultLayoutProps} props - The props for the component.
 * @returns {React.ReactElement} The default layout component.
 */
export const DefaultLayout: FC<DefaultLayoutProps> = ({ title, subtitle }): React.ReactElement => {
  const { buffering } = useBuffering();
  const opacity = useSharedValue(1);
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
  const { setOpacity } = useControlsVisibility();
  // console.log({videoTracks, textTracks, audioTracks});

  useEffect(() => {
    setOpacity(opacity);
  }, [opacity, setOpacity]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      backgroundColor: state.theme.colors.overlay,
      opacity: opacity.value,
    }),
    [state.theme.colors.overlay]
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.baseStyle, animatedStyle]} pointerEvents="box-none">
        <VideoPlayer.Controls>
          <View
            style={[layoutStyles.column, { justifyContent: 'space-between', height: '100%', paddingHorizontal: 15 }]}>
            <View style={layoutStyles.topControls}>
              <View>
                {title && <Title text={title} />}
                {subtitle && <Subtitle text={subtitle} />}
              </View>
              <View style={[layoutStyles.row]}>
                <View>
                  <VideoPlayer.SubtitleToggleButton />
                </View>
                <View>
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
                </View>
              </View>
            </View>
            <View style={layoutStyles.centerControls}>{!buffering ? <VideoPlayer.PlayButton /> : null}</View>
            <View style={[layoutStyles.bottomControls]}>
              <VideoPlayer.ProgressBar />
              <View style={layoutStyles.row}>
                <VideoPlayer.TimeDisplay />
                <View style={layoutStyles.spacer} />
                <View style={[layoutStyles.row]}>
                  <VideoPlayer.FullscreenButton />
                  <VideoPlayer.MuteButton style={{ marginLeft: 10 }} />
                </View>
              </View>
            </View>
          </View>
        </VideoPlayer.Controls>
      </Animated.View>
      {/* This is separate because, even tho after the autioHideDelay hides the controls the spinner should be visible when buffering */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {buffering && <VideoPlayer.LoadingSpinner />}
      </View>
    </View>
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
    alignItems: 'center',
  },
});
