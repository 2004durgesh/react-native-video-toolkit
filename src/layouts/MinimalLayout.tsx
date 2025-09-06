import { View, StyleSheet, ScrollView } from 'react-native';
import { useBuffering, useControlsVisibility, useSettings } from '../hooks';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useEffect } from 'react';
import { minimalTheme } from '../themes';
import { useVideo } from '../providers';
import { Menu, Subtitle, Title, CommonLayoutStyles as layoutStyles, VideoPlayer } from '../components';
/**
 * `MinimalLayout` is a predefined layout component for the video player controls,
 * offering a more streamlined and less intrusive user interface.
 * It includes essential controls like play/pause, progress bar, time display,
 * fullscreen toggle, mute button, and a settings button that opens a bottom sheet.
 *
 * @returns {React.ReactElement} A configured `VideoPlayer.Controls` component with a minimal layout.
 */
export const MinimalLayout = () => {
  const { buffering } = useBuffering();
  const opacity = useSharedValue(1);
  const { state, setTheme } = useVideo();
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
    setTheme(minimalTheme);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                <Title text="Minimal Title" />
                <Subtitle text="Minimal Subtitle" />
              </View>
              <View style={[layoutStyles.row]}>
                <View>
                  {/* <GestureDetector
                    >
                    <ChevronDown color={state.theme.colors.primary} size={24} />
                  </Gesture> */}
                </View>
                <View>
                  <Menu.Root>
                    <Menu.Trigger />
                    <Menu.Content>
                      <Menu.SubContent viewId="root">
                        <Menu.Item navigateTo="audio">Audio</Menu.Item>
                        <Menu.Item navigateTo="video">Video</Menu.Item>
                        <Menu.Item navigateTo="captions">Captions</Menu.Item>
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
