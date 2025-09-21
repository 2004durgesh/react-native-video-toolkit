import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { VideoPlayer, VideoProvider } from 'react-native-video-toolkit';
import { DemoScreen } from '../../components/DemoComponents';

const themes = {
  default: {
    name: 'Default Dark',
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      accent: '#FF9500',
      background: '#000000',
      overlay: 'rgba(0,0,0,0.7)',
      text: '#FFFFFF',
      textSecondary: '#A0A0A0',
      error: '#FF3B30',
      success: '#34C759',
      border: '#333333',
    },
  },
  netflix: {
    name: 'Netflix Style',
    colors: {
      primary: '#E50914',
      secondary: '#221F1F',
      accent: '#F5F5F1',
      background: '#141414',
      overlay: 'rgba(0,0,0,0.8)',
      text: '#FFFFFF',
      textSecondary: '#999999',
      error: '#E50914',
      success: '#46D369',
      border: '#333333',
    },
  },
  youtube: {
    name: 'YouTube Style',
    colors: {
      primary: '#FF0000',
      secondary: '#FF4444',
      accent: '#FFFFFF',
      background: '#0F0F0F',
      overlay: 'rgba(15,15,15,0.8)',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
      error: '#FF0000',
      success: '#00FF00',
      border: '#303030',
    },
  },
  minimal: {
    name: 'Minimal Light',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#007AFF',
      background: '#F5F5F5',
      overlay: 'rgba(255,255,255,0.9)',
      text: '#000000',
      textSecondary: '#666666',
      error: '#FF3B30',
      success: '#34C759',
      border: '#E5E5EA',
    },
  },
  gaming: {
    name: 'Gaming Theme',
    colors: {
      primary: '#00FF88',
      secondary: '#00CCFF',
      accent: '#FF6B00',
      background: '#0D1117',
      overlay: 'rgba(13,17,23,0.8)',
      text: '#F0F6FC',
      textSecondary: '#8B949E',
      error: '#F85149',
      success: '#56D364',
      border: '#21262D',
    },
  },
};

type ThemeKey = keyof typeof themes;

export default function ThemesScreen() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('default');

  const videoSource = {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  const currentTheme = themes[selectedTheme];

  return (
    <DemoScreen title="Theme Gallery" description="Explore different visual themes and styles">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Theme Selector */}
        <View style={styles.themeSelector}>
          <Text style={styles.sectionTitle}>🎨 Choose a Theme</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.themeList}>
              {(Object.keys(themes) as ThemeKey[]).map((themeKey) => (
                <TouchableOpacity
                  key={themeKey}
                  style={[styles.themeCard, selectedTheme === themeKey && styles.themeCardActive]}
                  onPress={() => setSelectedTheme(themeKey)}>
                  <View style={[styles.themePreview, { backgroundColor: themes[themeKey].colors.background }]}>
                    <View style={styles.themeColors}>
                      <View style={[styles.colorSwatch, { backgroundColor: themes[themeKey].colors.primary }]} />
                      <View style={[styles.colorSwatch, { backgroundColor: themes[themeKey].colors.secondary }]} />
                      <View style={[styles.colorSwatch, { backgroundColor: themes[themeKey].colors.accent }]} />
                    </View>
                  </View>
                  <Text style={[styles.themeName, selectedTheme === themeKey && styles.themeNameActive]}>
                    {themes[themeKey].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Themed Player */}
        <View style={styles.playerSection}>
          <Text style={styles.sectionTitle}>🎬 {currentTheme.name} Player</Text>
          <VideoProvider theme={currentTheme}>
            <VideoPlayer source={videoSource}>
              <VideoPlayer.Controls style={styles.playerControls}>
                <View style={styles.topControls}>
                  <VideoPlayer.MuteButton />
                  <VideoPlayer.VolumeControl />
                  <View style={{ flex: 1 }} />
                  <VideoPlayer.SettingsButton />
                  <VideoPlayer.FullscreenButton />
                </View>
                <View style={styles.centerControls}>
                  <VideoPlayer.LoadingSpinner />
                </View>
                <View style={styles.bottomControls}>
                  <VideoPlayer.PlayButton />
                  <VideoPlayer.TimeDisplay />
                  <VideoPlayer.ProgressBar />
                </View>
              </VideoPlayer.Controls>
            </VideoPlayer>
          </VideoProvider>
        </View>

        {/* Theme Details */}
        <View style={styles.themeDetails}>
          <Text style={styles.sectionTitle}>🎯 Theme Details</Text>
          <View style={styles.colorGrid}>
            {Object.entries(currentTheme.colors).map(([colorName, colorValue]) => (
              <View key={colorName} style={styles.colorItem}>
                <View style={[styles.colorBox, { backgroundColor: colorValue }]} />
                <View style={styles.colorInfo}>
                  <Text style={styles.colorName}>{colorName}</Text>
                  <Text style={styles.colorValue}>{colorValue}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Implementation Code */}
        <View style={styles.codeSection}>
          <Text style={styles.sectionTitle}>💻 Implementation</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{`const ${selectedTheme}Theme = ${JSON.stringify(currentTheme, null, 2)};

<VideoProvider theme={${selectedTheme}Theme}>
  <VideoPlayer source={videoSource}>
    <DefaultLayout />
  </VideoPlayer>
</VideoProvider>`}</Text>
          </View>
        </View>

        {/* Theme Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ Theming Features</Text>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🎨 Complete Color System</Text>
            <Text style={styles.featureDescription}>
              Primary, secondary, accent, background, text, and semantic colors
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>📏 Consistent Sizing</Text>
            <Text style={styles.featureDescription}>
              Icon sizes, spacing, and border radius following design system
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🔄 Runtime Switching</Text>
            <Text style={styles.featureDescription}>Change themes dynamically without reloading the app</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🎯 Custom Themes</Text>
            <Text style={styles.featureDescription}>Create your own themes by extending the base theme structure</Text>
          </View>
        </View>
      </ScrollView>
    </DemoScreen>
  );
}

const styles = StyleSheet.create({
  themeSelector: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  themeList: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  themeCard: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardActive: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  themePreview: {
    width: 80,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeColors: {
    flexDirection: 'row',
    gap: 4,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeName: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
    fontWeight: '500',
  },
  themeNameActive: {
    color: '#007AFF',
  },
  playerSection: {
    height: 250,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  playerControls: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeDetails: {
    margin: 16,
  },
  colorGrid: {
    gap: 8,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  colorBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  colorInfo: {
    flex: 1,
  },
  colorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  colorValue: {
    fontSize: 12,
    color: '#A0A0A0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
    fontSize: 11,
    lineHeight: 16,
  },
  featuresSection: {
    margin: 16,
    marginBottom: 32,
  },
  featureItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  },
});
