'use client';

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoPlayer, DefaultLayout, VideoProvider } from 'react-native-video-toolkit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
export function GettingStartedExample() {
  const videoSource = {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <VideoProvider
        config={{
          onShowControls() {
            console.log('controls shown');
          },
          onHideControls() {
            console.log('controls hidden');
          },
          autoPlay: false,
        }}>
        <View style={styles.videoContainer}>
          <VideoPlayer
            videoProps={{
              onLoad(e) {
                console.error('Video loaded', e);
              },
            }}
            containerStyle={styles.videoPlayer}
            source={videoSource}>
            <DefaultLayout title="Demo" subtitle="Video Player" />
          </VideoPlayer>
        </View>
      </VideoProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
  },
  videoContainer: {
    width: '100%',
    height: 500,
    backgroundColor: '#fff',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
});

export default GettingStartedExample;
