import React from 'react';
import { DefaultLayout, ThemeProvider } from 'react-native-video-toolkit';
import { ScreenLayout } from './components/ScreenLayout';
import { Text } from 'react-native';

export default function Index() {
  return (
    <ScreenLayout
      layout={
        <DefaultLayout
          title="Example Video"
          subtitle="react-native-video-toolkit"
          slots={
            {
              // beforeSubtitleToggleButton: <Text>Before</Text>,
              // afterSubtitleToggleButton: <Text>After</Text>,
              // beforeSettingsButton: <Text>Before Settings</Text>,
              // afterSettingsButton: <Text>After Settings</Text>,
              // beforeFullscreenButton: <Text>Before Fullscreen</Text>,
              // afterFullscreenButton: <Text>After Fullscreen</Text>,
              // beforeMuteButton: <Text>Before Mute</Text>,
              // afterMuteButton: <Text>After Mute</Text>,
              // beforeProgressBar: <Text>Before Progress Bar</Text>,
              // afterProgressBar: <Text>After Progress Bar</Text>,
              // beforeTimeDisplay: <Text>Before Time Display</Text>,
              // afterTimeDisplay: <Text>After Time Display</Text>,
              // beforeCenterPlayButton: <Text>Before Center Play Button</Text>,
              // afterCenterPlayButton: <Text>After Center Play Button</Text>,
            }
          }
        />
      }
    />
  );
}
