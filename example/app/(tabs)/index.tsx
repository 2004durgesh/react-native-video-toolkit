import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { DemoScreen, DemoCard, DemoSection } from '../components/DemoComponents';

export default function HomeScreen() {
  return (
    <DemoScreen
      title="Video Toolkit Demo"
      description="Comprehensive showcase of React Native Video Toolkit"
      showBackButton={false}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🎬</Text>
          </View>
          <Text style={styles.heroTitle}>React Native Video Toolkit</Text>
          <Text style={styles.heroSubtitle}>
            A powerful, feature-rich video player component with modern controls, gesture support, and beautiful themes.
          </Text>
        </View>

        {/* Quick Start Section */}
        <DemoSection title="🚀 Quick Start">
          <DemoCard
            title="Default Player"
            description="Ready-to-use video player with all controls"
            icon="play-circle-outline"
            color="#007AFF"
            onPress={() => router.push('/(tabs)/players/default')}
          />
          <DemoCard
            title="Custom Player"
            description="Build your own layout with compound components"
            icon="build-outline"
            color="#34C759"
            onPress={() => router.push('/(tabs)/players/custom')}
          />
        </DemoSection>

        {/* Features Overview */}
        <DemoSection title="✨ Key Features">
          <DemoCard
            title="Gesture Controls"
            description="Pinch to zoom, double tap, swipe gestures"
            icon="hand-right-outline"
            color="#FF9500"
            onPress={() => router.push('/(tabs)/features/gestures')}
          />
          <DemoCard
            title="Theming System"
            description="Customizable themes and styling options"
            icon="color-palette-outline"
            color="#AF52DE"
            onPress={() => router.push('/(tabs)/styling/themes')}
          />
          <DemoCard
            title="Advanced Controls"
            description="Volume, playback speed, fullscreen, subtitles"
            icon="settings-outline"
            color="#FF3B30"
            onPress={() => router.push('/(tabs)/features/controls')}
          />
        </DemoSection>

        {/* Platform Support */}
        <DemoSection title="📱 Platform Support">
          <View style={styles.platformCard}>
            <View style={styles.platformRow}>
              <View style={styles.platformItem}>
                <Text style={styles.platformEmoji}>✅</Text>
                <Text style={styles.platformText}>Android</Text>
              </View>
              <View style={styles.platformItem}>
                <Text style={styles.platformEmoji}>⚠️</Text>
                <Text style={styles.platformText}>iOS (Coming Soon)</Text>
              </View>
            </View>
            <View style={styles.platformRow}>
              <View style={styles.platformItem}>
                <Text style={styles.platformEmoji}>🌐</Text>
                <Text style={styles.platformText}>Web Support</Text>
              </View>
              <View style={styles.platformItem}>
                <Text style={styles.platformEmoji}>📺</Text>
                <Text style={styles.platformText}>TV Ready</Text>
              </View>
            </View>
          </View>
        </DemoSection>

        {/* Getting Started */}
        <DemoSection title="📚 Documentation">
          <DemoCard
            title="Installation Guide"
            description="Step-by-step setup instructions"
            icon="download-outline"
            color="#5856D6"
            onPress={() => router.push('/(tabs)/players/installation')}
          />
          <DemoCard
            title="API Reference"
            description="Complete component and props documentation"
            icon="library-outline"
            color="#007AFF"
            onPress={() => router.push('/(tabs)/features/api')}
          />
        </DemoSection>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Built with ❤️ for React Native developers</Text>
        </View>
      </ScrollView>
    </DemoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 24,
  },
  platformCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  platformItem: {
    alignItems: 'center',
    flex: 1,
  },
  platformEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  platformText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#6D6D70',
    fontSize: 14,
    textAlign: 'center',
  },
});
