'use client';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  VideoPlayer,
  PlayButton,
  ProgressBar,
  TimeDisplay,
  FullscreenButton,
  MuteButton,
  VolumeControl,
  LoadingSpinner,
  SettingsButton,
} from 'react-native-video-toolkit';

export const CustomPlayerUI = () => {
  return (
    <VideoPlayer.Controls style={styles.controlsContainer}>
      {/* Top controls */}
      <View style={styles.topControls}>
        <MuteButton />
        <VolumeControl />
        <View style={{ flex: 1 }} /> {/* Spacer */}
        <FullscreenButton />
        <SettingsButton />
        {/* Use Menu for settings sheet */}
      </View>

      {/* Middle controls (e.g., loading spinner) */}
      <View style={styles.middleControls}>
        <LoadingSpinner />
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <View style={{ flexDirection: 'row' }}>
          <PlayButton />
          <TimeDisplay />
        </View>
        <ProgressBar />
      </View>
    </VideoPlayer.Controls>
  );
};

export const CustomizationExample = () => {
  const videoSource = {
    uri: '/test.mp4',
  };

  return (
    <VideoPlayer containerStyle={styles.videoPlayer} source={videoSource}>
      <CustomPlayerUI />
    </VideoPlayer>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  middleControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'column',
    padding: 16,
  },
  videoPlayer: {
    width: '100%',
    // @ts-ignore
    height: '100vh', // for web, take full height of the viewport, since the example is been rendered on web
  },
});

export default CustomizationExample;
