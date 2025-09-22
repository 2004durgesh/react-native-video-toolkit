'use client';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { VideoPlayer, VideoProvider, DefaultLayout } from 'react-native-video-toolkit';
import { Badge } from '../ui/badge';

// Define multiple themes for demonstration
const themes = {
  default: {
    name: 'Default Dark',
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      accent: '#FF9500',
      background: '#221F1F',
      overlay: 'rgba(0,0,0,0.7)',
      text: '#FFFFFF',
      error: '#FF3B30',
      success: '#34C759',
      border: '#333333',
    },
    iconSizes: { sm: 16, md: 24, lg: 32 },
    sizing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: 8,
    fonts: { regular: 'System', medium: 'System', bold: 'System' },
    fontSizes: { sm: 12, md: 16, lg: 20 },
    animations: { fast: 150, normal: 300, slow: 500 },
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
      error: '#E50914',
      success: '#46D369',
      border: '#333333',
    },
    iconSizes: { sm: 16, md: 24, lg: 32 },
    sizing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: 8,
    fonts: { regular: 'System', medium: 'System', bold: 'System' },
    fontSizes: { sm: 12, md: 16, lg: 20 },
    animations: { fast: 150, normal: 300, slow: 500 },
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
      error: '#FF0000',
      success: '#00FF00',
      border: '#303030',
    },
    iconSizes: { sm: 16, md: 24, lg: 32 },
    sizing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: 8,
    fonts: { regular: 'System', medium: 'System', bold: 'System' },
    fontSizes: { sm: 12, md: 16, lg: 20 },
    animations: { fast: 150, normal: 300, slow: 500 },
  },
};

type ThemeKey = keyof typeof themes;

export const ThemeSelectorExample = () => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('default');

  const videoSource = {
    uri: '/test.mp4',
  };

  const currentTheme = themes[selectedTheme];

  return (
    // On native use <View style={styles.container}> instead of div
    <View style={styles.container}>
      {/* Theme Selector */}
      <View style={styles.themeSelector}>
        {/* On native use <Text> instead of p */}
        <p>Choose a Theme:</p>
        <View style={styles.themeButtons}>
          {(Object.keys(themes) as ThemeKey[]).map((themeKey) => (
            <TouchableOpacity key={themeKey} style={styles.themeButtons} onPress={() => setSelectedTheme(themeKey)}>
              <Badge variant={selectedTheme === themeKey ? 'default' : 'secondary'}>{themes[themeKey].name}</Badge>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Themed Video Player */}
      <VideoProvider theme={currentTheme}>
        <VideoPlayer source={videoSource} videoStyle={{ height: '50%' }} containerStyle={styles.videoPlayer}>
          <DefaultLayout title="Themed Player Demo" subtitle={`Using ${currentTheme.name} theme`} />
        </VideoPlayer>
      </VideoProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
    flex: 1,
    width: '100%',
  },
  themeSelector: {
    paddingBottom: 10,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    // color: '#333',
  },
  themeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  videoPlayer: {
    width: '100%',
    // @ts-ignore
    height: '50vh',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});
