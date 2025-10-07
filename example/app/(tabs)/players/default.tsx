import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { VideoPlayer, VideoProvider, DefaultLayout, type VideoSource } from 'react-native-video-toolkit';
import { DemoScreen } from '../../components/DemoComponents';
import { Ionicons } from '@expo/vector-icons';

const videoSources: { title: string; source: VideoSource }[] = [
  {
    title: 'mp4',
    source: { uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  },
  {
    title: 'hls',
    source: { uri: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8' },
  },
  {
    title: 'dash',
    source: { uri: 'https://dash.akamaized.net/dash264/TestCasesUHD/2b/11/MultiRate.mpd' },
  },
  { title: 'asset', source: { uri: require('../../../../assets/test.mp4') } },
  { title: 'asset-vertical', source: { uri: require('../../../../assets/vertical.mp4') } },
];

export default function DefaultPlayerScreen() {
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [showVideoSelector, setShowVideoSelector] = useState(false);

  const currentVideo = videoSources[selectedVideo] || videoSources[0];

  return (
    <DemoScreen title="Default Layout Player" description="Pre-built layout with all controls included">
      <View style={styles.container}>
        {/* Video Selector */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity style={styles.selectorButton} onPress={() => setShowVideoSelector(!showVideoSelector)}>
            <Text style={styles.selectorButtonText}>{currentVideo?.title}</Text>
            <Ionicons name={showVideoSelector ? 'chevron-up' : 'chevron-down'} size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {showVideoSelector && (
            <View style={styles.selectorDropdown}>
              {videoSources.map((video, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.selectorOption, index === selectedVideo && styles.selectorOptionActive]}
                  onPress={() => {
                    setSelectedVideo(index);
                    setShowVideoSelector(false);
                  }}>
                  <Text style={styles.selectorOptionText}>{video.title}</Text>
                  {index === selectedVideo && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Video Player */}
        <View style={styles.playerContainer}>
          <VideoPlayer
            source={currentVideo?.source!}
            videoProps={{
              onLoad(e) {
                console.log('Video loading started', e);
              },
            }}>
            <DefaultLayout title={currentVideo?.title} subtitle="React Native Video Toolkit" />
          </VideoPlayer>
        </View>
      </View>
    </DemoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectorContainer: {
    margin: 16,
    zIndex: 1000,
  },
  selectorButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  selectorDropdown: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  selectorOption: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectorOptionActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  selectorOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  playerContainer: {
    height: 250,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  featuresList: {
    flex: 1,
    marginTop: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  featureText: {
    marginLeft: 12,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  },
});
