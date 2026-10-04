import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VideoConfig } from 'react-native-video';
import { VideoPlayer, DefaultLayout, useVideo, VideoProvider } from 'react-native-video-toolkit';

// Public sample captions (video.js "Elephants Dream" example). They won't line up with these
// videos' dialogue, but they're reachable and exercise subtitle selection, CJK and RTL text.
const CAPTIONS_BASE_URL = 'https://cdn.jsdelivr.net/gh/videojs/video.js@main/docs/examples/elephantsdream';

const externalSubtitles: NonNullable<VideoConfig['externalSubtitles']> = [
  { uri: `${CAPTIONS_BASE_URL}/captions.en.vtt`, label: 'English', language: 'en', type: 'vtt' },
  { uri: `${CAPTIONS_BASE_URL}/captions.ja.vtt`, label: '日本語', language: 'ja', type: 'vtt' },
  { uri: `${CAPTIONS_BASE_URL}/captions.ar.vtt`, label: 'العربية', language: 'ar', type: 'vtt' },
  { uri: `${CAPTIONS_BASE_URL}/captions.ru.vtt`, label: 'Русский', language: 'ru', type: 'vtt' },
  { uri: `${CAPTIONS_BASE_URL}/captions.sv.vtt`, label: 'Svenska', language: 'sv', type: 'vtt' },
];

const videoSources: { title: string; source: VideoConfig }[] = [
  {
    title: 'HLS - Tears of Steel',
    source: {
      uri: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      externalSubtitles,
    },
  },
  {
    title: 'MP4 - Big Buck Bunny (10s)',
    source: {
      uri: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4',
      externalSubtitles,
    },
  },
  {
    title: 'DASH - Test Stream',
    source: { uri: 'https://dash.akamaized.net/dash264/TestCasesUHD/2b/11/MultiRate.mpd', externalSubtitles },
  },
  {
    title: 'local MP4',
    source: { uri: require('../../../assets/test.mp4'), externalSubtitles },
  },
  {
    title: 'local MP4 (Vertical)',
    source: { uri: require('../../../assets/vertical.mp4'), externalSubtitles },
  },
];

function VideoSourceSelector({
  selectedIndex,
  onSelect,
}: {
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.sourceSelector}>
      <Text style={styles.selectorTitle}>Select Video Source</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {videoSources.map((video, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.sourceButton, index === selectedIndex && styles.sourceButtonActive]}
            onPress={() => onSelect(index)}>
            <Text style={[styles.sourceButtonText, index === selectedIndex && styles.sourceButtonTextActive]}>
              {video.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function Player({ source, title }: { source: VideoConfig; title: string }) {
  const { state } = useVideo();

  return (
    <View style={state.fullscreen ? styles.fullscreenContainer : styles.playerContainer}>
      <VideoPlayer
        events={{
          onLoad: (e) => console.log(e),
        }}
        source={source}
        // style={{height:1000}}
        containerStyle={state.fullscreen ? styles.fullscreenVideo : undefined}>
        <DefaultLayout
          title={title}
          titleProps={{
            style: {
              color: 'red',
            },
          }}
          slots={
            {
              // beforeProgressBar: <Button title="button" onPress={() => {}} />,
              // afterProgressBar: <Button title="button" onPress={() => {}} />,
            }
          }
        />
      </VideoPlayer>
    </View>
  );
}

function HomeContent() {
  const [selectedVideo, setSelectedVideo] = useState(0);
  const currentVideo = videoSources[selectedVideo]!;
  const { state } = useVideo();

  // Hide everything except video when in fullscreen
  if (state.fullscreen) {
    return (
      <View style={styles.fullscreenWrapper}>
        <StatusBar hidden />
        <Player key={selectedVideo} source={currentVideo.source} title={currentVideo.title} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Video Toolkit Test</Text>
        <Text style={styles.headerSubtitle}>Testing video playback features</Text>
      </View>

      {/* Video Source Selector */}
      <VideoSourceSelector selectedIndex={selectedVideo} onSelect={setSelectedVideo} />

      {/* Video Player */}
      <Player key={selectedVideo} source={currentVideo.source} title={currentVideo.title} />

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Now Playing</Text>
        <Text style={styles.infoText}>{currentVideo.title}</Text>
        <Text style={styles.infoHint}>
          • Double tap sides to seek{'\n'}• Tap to show/hide controls{'\n'}• Use fullscreen button to test fullscreen
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return (
    <VideoProvider>
      <HomeContent />
    </VideoProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  sourceSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  sourceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  sourceButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sourceButtonText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  sourceButtonTextActive: {
    color: '#fff',
  },
  playerContainer: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenVideo: {
    flex: 1,
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  infoHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 16,
    lineHeight: 22,
  },
});
