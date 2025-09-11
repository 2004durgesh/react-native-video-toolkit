import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import {
  VideoPlayer,
  PlayButton,
  ProgressBar,
  TimeDisplay,
  FullscreenButton,
  MuteButton,
  VolumeControl,
  LoadingSpinner,
  useVideo,
  VideoProvider,
} from 'react-native-video-toolkit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const customTheme = {
  colors: {
    primary: '#ff6347', // Tomato red
    secondary: '#4682b4', // Steel blue
    accent: '#ffeb3b', // Bright yellow
    background: '#121212', // Dark background (better than semi-transparent for base)
    overlay: 'rgba(0,0,0,0.6)', // Semi-transparent overlay
    text: '#ffffff', // White text
    textSecondary: '#b0b0b0', // Muted gray
    error: '#e74c3c', // Red for errors
    success: '#2ecc71', // Green for success
    border: '#333333', // Dark gray borders
    focus: '#ff9800', // Orange highlight for focus
  },
  sizing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  iconSizes: {
    sm: 16,
    md: 24,
    lg: 32,
  },
  borderRadius: 8, // medium rounded corners
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSizes: {
    sm: 12,
    md: 16,
    lg: 20,
  },
  animations: {
    fast: 150, // ms
    normal: 300, // ms
    slow: 500, // ms
  },
};

const CustomPlayerUI = () => {
  return (
    <VideoPlayer.Controls style={styles.controlsContainer}>
      <View style={styles.topControls}>
        <MuteButton />
        <VolumeControl />
        <View style={{ flex: 1 }} />
        <FullscreenButton />
      </View>
      <View style={styles.middleControls}>
        <LoadingSpinner />
      </View>
      <View style={styles.bottomControls}>
        <PlayButton />
        <TimeDisplay />
        <ProgressBar />
      </View>
    </VideoPlayer.Controls>
  );
};

const CustomPlayer = () => {
  const videoSource = {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'black' }}>
      <SafeAreaView edges={['top']}>
        <VideoProvider
          theme={{ ...customTheme }}
          config={{
            enableScreenRotation: true,
            onEnterFullscreen: () => console.log('Entered fullscreen'),
            onExitFullscreen: () => console.log('Exited fullscreen'),
            onHideControls: () => console.log('Controls hidden'),
            onShowControls: () => console.log('Controls shown'),
          }}>
          <VideoPlayer source={videoSource}>
            <CustomPlayerUI />
          </VideoPlayer>
        </VideoProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
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
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
});

export default CustomPlayer;
