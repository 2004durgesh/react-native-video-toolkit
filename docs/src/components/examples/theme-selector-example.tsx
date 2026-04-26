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
      textMain: '#FFFFFF',
      textSecondary: 'rgba(255,255,255,0.7)',
      iconNormal: '#FFFFFF',
      iconActive: '#007AFF',
      sliderTrackActive: '#007AFF',
      sliderTrackInactive: '#333333',
      sliderTrackCache: 'rgba(255,255,255,0.7)',
      sliderThumb: '#007AFF',
      menuBackground: '#221F1F',
      menuBorder: '#333333',
      menuText: '#FFFFFF',
      menuSeparator: '#333333',
      badgeBackground: 'rgba(0,0,0,0.7)',
      ripple: '#5856D6',
      spinner: '#007AFF',
      error: '#FF3B30',
      success: '#34C759',
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
      textMain: '#FFFFFF',
      textSecondary: 'rgba(255,255,255,0.7)',
      iconNormal: '#FFFFFF',
      iconActive: '#E50914',
      sliderTrackActive: '#E50914',
      sliderTrackInactive: '#333333',
      sliderTrackCache: 'rgba(255,255,255,0.7)',
      sliderThumb: '#E50914',
      menuBackground: '#141414',
      menuBorder: '#333333',
      menuText: '#FFFFFF',
      menuSeparator: '#333333',
      badgeBackground: 'rgba(0,0,0,0.8)',
      ripple: '#333333',
      spinner: '#E50914',
      error: '#E50914',
      success: '#46D369',
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
      textMain: '#FFFFFF',
      textSecondary: 'rgba(255,255,255,0.7)',
      iconNormal: '#FFFFFF',
      iconActive: '#FF0000',
      sliderTrackActive: '#FF0000',
      sliderTrackInactive: '#303030',
      sliderTrackCache: 'rgba(255,255,255,0.7)',
      sliderThumb: '#FF0000',
      menuBackground: '#0F0F0F',
      menuBorder: '#303030',
      menuText: '#FFFFFF',
      menuSeparator: '#303030',
      badgeBackground: 'rgba(15,15,15,0.8)',
      ripple: '#303030',
      spinner: '#FF0000',
      error: '#FF0000',
      success: '#00FF00',
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
