import { View, StyleSheet } from 'react-native';
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
  const { isSettingsMenuVisible, toggleSettingsMenu } = useSettings();
  // Get theme and store functions
  const { setOpacity } = useControlsVisibility();

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
    <Animated.View style={[styles.baseStyle, animatedStyle]} pointerEvents="box-none">
      <VideoPlayer.Controls>
        <View style={[layoutStyles.column, { justifyContent: 'space-between', height: '100%', paddingHorizontal: 15 }]}>
          <View style={layoutStyles.topControls}>
            <View>
              <Title text="Minimal Title" />
              <Subtitle text="Minimal Subtitle" />
            </View>
            <View>
              <Menu.Root>
                <Menu.Trigger />
                <Menu.Content>
                  <Menu.SubContent viewId="root">
                    <Menu.Item navigateTo="audio">Audio</Menu.Item>
                    <Menu.Item navigateTo="video">Video</Menu.Item>
                    <Menu.Item navigateTo="playback">Playback Rate</Menu.Item>
                    <Menu.Separator />
                    <Menu.Close />
                  </Menu.SubContent>
                  <Menu.SubContent viewId="audio">
                    {/* Audio options, e.g., tracks or volume */}
                    <Menu.RadioGroup value="Audio" onValueChange={(value) => console.log(value)}>
                      <Menu.RadioItem value="en">English</Menu.RadioItem>
                      <Menu.RadioItem value="es">Spanish</Menu.RadioItem>
                    </Menu.RadioGroup>
                  </Menu.SubContent>
                  <Menu.SubContent viewId="video">
                    <Menu.RadioGroup value="Audio" onValueChange={(value) => console.log(value)}>
                      <Menu.RadioItem value="en">English</Menu.RadioItem>
                      <Menu.RadioItem value="es">Spanish</Menu.RadioItem>
                    </Menu.RadioGroup>
                  </Menu.SubContent>
                  <Menu.SubContent viewId="playback">
                    <Menu.Item value={0.5} onPress={() => console.log('Set rate to 0.5x')}>
                      0.5x
                    </Menu.Item>
                    <Menu.Item value={1} onPress={() => console.log('Set rate to 1x')}>
                      1x (Normal)
                    </Menu.Item>
                  </Menu.SubContent>
                </Menu.Content>
              </Menu.Root>
            </View>
          </View>
          <View style={layoutStyles.centerControls}>
            {!buffering ? <VideoPlayer.PlayButton /> : <VideoPlayer.LoadingSpinner />}
          </View>
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
