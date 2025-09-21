import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { VideoPlayer, VideoProvider } from 'react-native-video-toolkit';
import { DemoScreen } from '../../components/DemoComponents';
import { Ionicons } from '@expo/vector-icons';

export default function GesturesScreen() {
  const [gesturesEnabled, setGesturesEnabled] = useState(true);

  const videoSource = {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  return (
    <DemoScreen title="Gesture Controls" description="Interactive touch gestures for video control">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Interactive Player */}
        <View style={styles.playerSection}>
          <Text style={styles.sectionTitle}>🤏 Try the Gestures</Text>
          <Text style={styles.instructionText}>Try the gestures below on this video player</Text>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Gestures:</Text>
            <TouchableOpacity
              style={[styles.toggleButton, gesturesEnabled && styles.toggleActive]}
              onPress={() => setGesturesEnabled(!gesturesEnabled)}>
              <Text style={[styles.toggleText, gesturesEnabled && styles.toggleTextActive]}>
                {gesturesEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>

          <VideoProvider
            config={{
              enableDoubleTapGestures: gesturesEnabled,
              enablePanGestures: gesturesEnabled,
              enableFullscreen: true,
              autoHideControls: true,
              autoHideDelay: 2000,
            }}>
            <VideoPlayer source={videoSource}>
              <VideoPlayer.Controls style={styles.playerControls}>
                <View style={styles.gestureOverlay}>
                  <Text style={styles.gestureHint}>
                    {gesturesEnabled ? 'Try double tap or pinch gestures!' : 'Gestures disabled'}
                  </Text>
                </View>
                <View style={styles.basicControls}>
                  <VideoPlayer.PlayButton />
                  <VideoPlayer.ProgressBar />
                  <VideoPlayer.FullscreenButton />
                </View>
              </VideoPlayer.Controls>
            </VideoPlayer>
          </VideoProvider>
        </View>

        {/* Configuration Options */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>⚙️ Gesture Configuration</Text>

          <View style={styles.configItem}>
            <Text style={styles.configTitle}>enableDoubleTapGestures</Text>
            <Text style={styles.configDescription}>Enable double tap to seek forward/backward</Text>
            <View style={styles.configCode}>
              <Text style={styles.codeText}>config.enableDoubleTapGestures = true</Text>
            </View>
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configTitle}>enablePanGestures</Text>
            <Text style={styles.configDescription}>Enable horizontal pan to seek through video</Text>
            <View style={styles.configCode}>
              <Text style={styles.codeText}>config.enablePanGestures = true</Text>
            </View>
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configTitle}>config</Text>
            <Text style={styles.configDescription}>Fine-tune gesture behavior and sensitivity</Text>
            <View style={styles.configCode}>
              <Text style={styles.codeText}>{`config={{
  enableDoubleTap: true,
  enablePinchToZoom: true,
  seekAmount: 10
}}`}</Text>
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
  instructionText: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 12,
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  toggleText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  playerControls: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  gestureOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  gestureHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  basicControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gesturesSection: {
    margin: 16,
  },
  gestureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  gestureDisabled: {
    opacity: 0.6,
  },
  gestureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gestureContent: {
    flex: 1,
  },
  gestureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gestureDescription: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 6,
  },
  gestureInstruction: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  disabledText: {
    color: '#666666',
  },
  comingSoonBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  configSection: {
    margin: 16,
    marginBottom: 32,
  },
  configItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  configDescription: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 12,
  },
  configCode: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
  },
  codeText: {
    color: '#F2F2F7',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
});
