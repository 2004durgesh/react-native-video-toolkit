import { View, StyleSheet } from 'react-native';
import React from 'react';
import { DefaultLayout, VideoPlayer } from 'react-native-video-toolkit';
import type { CustomVideoTrack } from 'react-native-video-toolkit';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Example demonstrating custom video tracks for quality selection.
 * This is useful for HLS/DASH streams where you want to provide
 * manual quality selection options to users.
 *
 * CustomVideoTrack provides a user-friendly API:
 * - `label`: Display name in the UI (e.g., "Auto", "1080p HD")
 * - `height`: Resolution height in pixels
 * - `uri`: Optional direct URL to the quality stream
 */

// Define custom video tracks with user-friendly labels
// Based on the HLS manifest resolutions for Tears of Steel
const customVideoTracks: CustomVideoTrack[] = [
  {
    height: 0, // Auto quality selection
    label: 'Auto',
  },
  {
    height: 100,
    label: '100p (224x100)',
    // uri: 'tears-of-steel-audio_eng=64008-video_eng=401000.m3u8',
  },
  {
    height: 200,
    label: '200p (448x200)',
    // uri: 'tears-of-steel-audio_eng=128002-video_eng=751000.m3u8',
  },
  {
    height: 350,
    label: '350p (784x350)',
    // uri: 'tears-of-steel-audio_eng=128002-video_eng=1001000.m3u8',
  },
  {
    height: 750,
    label: '750p SD (1680x750)',
    // uri: 'tears-of-steel-audio_eng=128002-video_eng=1501000.m3u8',
  },
  {
    height: 750,
    label: '750p HD (1680x750)',
    // Higher bitrate variant
    // uri: 'tears-of-steel-audio_eng=128002-video_eng=2200000.m3u8',
  },
];

const Custom = () => {
  return (
    <SafeAreaView style={styles.container}>
      <VideoPlayer
        source={{
          uri: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        }}
        customVideoTracks={customVideoTracks}>
        <DefaultLayout title="Tears of Steel" subtitle="Custom Quality Selection" />
      </VideoPlayer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default Custom;
