'use client';
import React from 'react';
import { StyleSheet } from 'react-native';
import { DefaultLayout, VideoPlayer, VideoProvider } from 'react-native-video-toolkit';

// Picture-in-picture is opt-in; DefaultLayout then shows the button next to fullscreen.
const config = { enablePictureInPicture: true };

export const PictureInPictureButtonUsageExample = () => {
  return (
    <VideoProvider config={config}>
      <VideoPlayer source={{ uri: '/test.mp4' }} containerStyle={styles.player}>
        <DefaultLayout />
      </VideoPlayer>
    </VideoProvider>
  );
};

const styles = StyleSheet.create({
  player: {
    width: '100%',
    height: 260,
  },
});
