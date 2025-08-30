import { View } from 'react-native';
import { CommonLayoutStyles as layoutStyles, VideoPlayer, Title, Subtitle } from '../components';
import { useBuffering } from '../hooks';
import { defaultTheme } from '../themes';
import { useEffect } from 'react';
import { useVideo } from '../providers';

/**
 * `DefaultLayout` is a predefined layout component for the video player controls.
 * It arranges common video player controls such as play/pause, progress bar, time display,
 * fullscreen toggle, and mute button in a standard configuration.
 * This layout serves as a sensible default for most video playback scenarios.
 *
 * @returns {React.ReactElement} A configured `VideoPlayer.Controls` component with default layout.
 */
export const DefaultLayout = () => {
  const { buffering } = useBuffering();
  const { setTheme } = useVideo();

  useEffect(() => {
    setTheme(defaultTheme);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VideoPlayer.Controls>
      <View style={[layoutStyles.column, { justifyContent: 'space-between', height: '100%' }]}>
        <View style={layoutStyles.topControls}>
          <Title text="Default Title" />
          <Subtitle text="Deafult Subtitle" />
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
  );
};
