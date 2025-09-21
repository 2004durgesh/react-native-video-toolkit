import React from 'react';
import { View, StyleSheet, Text, ScrollView, Platform } from 'react-native';
import { VideoPlayer, VideoProvider } from 'react-native-video-toolkit';
import { DemoScreen } from '../../components/DemoComponents';

const customTheme = {
  colors: {
    primary: '#ff6347', // Tomato red
    secondary: '#4682b4', // Steel blue
    accent: '#ffeb3b', // Bright yellow
    background: '#121212', // Dark background
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
  borderRadius: 8,
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
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

const CustomPlayerUI = () => {
  return (
    <VideoPlayer.Controls style={styles.controlsContainer}>
      <View style={styles.topControls}>
        <VideoPlayer.MuteButton />
        <VideoPlayer.VolumeControl />
        <View style={{ flex: 1 }} />
        <VideoPlayer.FullscreenButton />
      </View>
      <View style={styles.middleControls}>
        <VideoPlayer.LoadingSpinner />
      </View>
      <View style={styles.bottomControls}>
        <VideoPlayer.PlayButton />
        <VideoPlayer.TimeDisplay />
        <VideoPlayer.ProgressBar />
      </View>
    </VideoPlayer.Controls>
  );
};

export default function CustomPlayerScreen() {
  const videoSource = {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  return (
    <DemoScreen title="Custom Player Layout" description="Build your own player with custom controls and theming">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Custom Player */}
        <View style={styles.playerSection}>
          <VideoProvider theme={customTheme}>
            <VideoPlayer source={videoSource}>
              <CustomPlayerUI />
            </VideoPlayer>
          </VideoProvider>
        </View>

        {/* Custom Theme Preview */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionTitle}>🎨 Custom Theme</Text>
          <View style={styles.colorGrid}>
            <View style={styles.colorRow}>
              <View style={[styles.colorItem, { backgroundColor: customTheme.colors.primary }]}>
                <Text style={styles.colorLabel}>Primary</Text>
              </View>
              <View style={[styles.colorItem, { backgroundColor: customTheme.colors.secondary }]}>
                <Text style={styles.colorLabel}>Secondary</Text>
              </View>
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorItem, { backgroundColor: customTheme.colors.accent }]}>
                <Text style={[styles.colorLabel, { color: '#000' }]}>Accent</Text>
              </View>
              <View style={[styles.colorItem, { backgroundColor: customTheme.colors.success }]}>
                <Text style={styles.colorLabel}>Success</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Implementation Code */}
        <View style={styles.codeSection}>
          <Text style={styles.sectionTitle}>💻 Implementation</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{`const CustomPlayerUI = () => {
  return (
    <VideoPlayer.Controls>
      <View style={styles.topControls}>
        <VideoPlayer.MuteButton />
        <VideoPlayer.VolumeControl />
        <VideoPlayer.FullscreenButton />
      </View>
      <View style={styles.bottomControls}>
        <VideoPlayer.PlayButton />
        <VideoPlayer.TimeDisplay />
        <VideoPlayer.ProgressBar />
      </View>
    </VideoPlayer.Controls>
  );
};`}</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ Custom Features</Text>
          <Text style={styles.featureText}>🎨 Custom tomato red theme</Text>
          <Text style={styles.featureText}>🔧 Compound component architecture</Text>
          <Text style={styles.featureText}>📱 Responsive layout design</Text>
          <Text style={styles.featureText}>⚡ Smooth animations</Text>
          <Text style={styles.featureText}>🎯 Focused control placement</Text>
        </View>
      </ScrollView>
    </DemoScreen>
  );
}

const styles = StyleSheet.create({
  playerSection: {
    height: 250,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  middleControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  colorGrid: {
    gap: 12,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorItem: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  codeSection: {
    margin: 16,
  },
  codeBlock: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
  },
  codeText: {
    color: '#F2F2F7',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  featuresSection: {
    margin: 16,
    marginBottom: 32,
  },
  featureText: {
    color: '#A0A0A0',
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
});
