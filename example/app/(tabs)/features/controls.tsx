import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { VideoPlayer, VideoProvider } from 'react-native-video-toolkit';
import { DemoScreen } from '../../components/DemoComponents';
import { Ionicons } from '@expo/vector-icons';

const ControlDemo = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <View style={styles.controlDemo}>
    <View style={styles.controlHeader}>
      <Text style={styles.controlTitle}>{title}</Text>
      <Text style={styles.controlDescription}>{description}</Text>
    </View>
    <View style={styles.controlPreview}>{children}</View>
  </View>
);

export default function ControlsScreen() {
  const videoSource = {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  return (
    <DemoScreen title="Control Components" description="Individual controls and their capabilities">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Full Player for Reference */}
        <View style={styles.playerSection}>
          <Text style={styles.sectionTitle}>🎬 Complete Player</Text>
          <VideoPlayer source={videoSource}>
            <VideoPlayer.Controls style={styles.fullControls}>
              <View style={styles.fullControlsTop}>
                <VideoPlayer.MuteButton />
                <VideoPlayer.VolumeControl />
                <View style={{ flex: 1 }} />
                <VideoPlayer.SettingsButton />
                <VideoPlayer.FullscreenButton />
              </View>
              <View style={styles.fullControlsCenter}>
                <VideoPlayer.LoadingSpinner />
              </View>
              <View style={styles.fullControlsBottom}>
                <VideoPlayer.PlayButton />
                <VideoPlayer.TimeDisplay />
                <VideoPlayer.ProgressBar />
              </View>
            </VideoPlayer.Controls>
          </VideoPlayer>
        </View>

        {/* Individual Controls */}
        <View style={styles.controlsSection}>
          <Text style={styles.sectionTitle}>🎛️ Individual Controls</Text>

          <ControlDemo title="Play Button" description="Toggle between play and pause states">
            <VideoPlayer.PlayButton />
          </ControlDemo>

          <ControlDemo title="Progress Bar" description="Seek through video with touch gestures">
            <VideoPlayer.ProgressBar />
          </ControlDemo>

          <ControlDemo title="Time Display" description="Shows current time and total duration">
            <VideoPlayer.TimeDisplay />
          </ControlDemo>

          <ControlDemo title="Volume Control" description="Adjustable volume slider">
            <VideoPlayer.VolumeControl />
          </ControlDemo>

          <ControlDemo title="Mute Button" description="Toggle audio on/off">
            <VideoPlayer.MuteButton />
          </ControlDemo>

          <ControlDemo title="Fullscreen Button" description="Enter/exit fullscreen mode">
            <VideoPlayer.FullscreenButton />
          </ControlDemo>

          <ControlDemo title="Settings Button" description="Access quality and playback options">
            <VideoPlayer.SettingsButton />
          </ControlDemo>

          <ControlDemo title="Subtitle Toggle" description="Enable/disable subtitle display">
            <VideoPlayer.SubtitleToggleButton />
          </ControlDemo>

          <ControlDemo title="Loading Spinner" description="Indicates buffering state">
            <VideoPlayer.LoadingSpinner />
          </ControlDemo>
        </View>

        {/* Control Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ Control Features</Text>

          <View style={styles.featureGrid}>
            <View style={styles.featureItem}>
              <Ionicons name="hand-right-outline" size={24} color="#34C759" />
              <Text style={styles.featureTitle}>Touch Gestures</Text>
              <Text style={styles.featureDescription}>
                All controls support touch interactions with visual feedback
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="eye-outline" size={24} color="#007AFF" />
              <Text style={styles.featureTitle}>Auto Hide</Text>
              <Text style={styles.featureDescription}>Controls automatically hide after inactivity</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="color-palette-outline" size={24} color="#AF52DE" />
              <Text style={styles.featureTitle}>Themeable</Text>
              <Text style={styles.featureDescription}>Customize colors, sizes, and styles</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="resize-outline" size={24} color="#FF9500" />
              <Text style={styles.featureTitle}>Responsive</Text>
              <Text style={styles.featureDescription}>Adapts to different screen sizes and orientations</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </DemoScreen>
  );
}

const styles = StyleSheet.create({
  playerSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  fullControls: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  fullControlsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullControlsCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullControlsBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlsSection: {
    margin: 16,
  },
  controlDemo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  controlHeader: {
    marginBottom: 12,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  controlDescription: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  controlPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  featuresSection: {
    margin: 16,
    marginBottom: 32,
  },
  featureGrid: {
    gap: 16,
  },
  featureItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 20,
  },
});
