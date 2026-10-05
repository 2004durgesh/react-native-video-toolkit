import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextTrackType, type ReactVideoProps, type TextTracks } from 'react-native-video';
import { VideoPlayer, DefaultLayout, useVideo, VideoProvider } from 'react-native-video-toolkit';
import { APP_PORTAL_HOST } from '../../constants';

const SUBTITLE_BASE_URL =
  'https://nwfah.stellarfrontier.website/anime/4b5ed938de41e4ff532c02c27dfd143a/7523240ff694934e2db9a9d558597f64/subtitles';

// English comes first: it's the default track, and the toolkit auto-selects the first text track.
const subtitleTracks: TextTracks = [
  { title: 'English', language: 'en', type: TextTrackType.VTT, uri: `${SUBTITLE_BASE_URL}/eng-2.vtt` },
  {
    title: 'Chinese (Chinese - (Simplified))',
    language: 'zh',
    type: TextTrackType.VTT,
    uri: `${SUBTITLE_BASE_URL}/chi-3.vtt`,
  },
  {
    title: 'Chinese (Chinese - (Traditional))',
    language: 'zh',
    type: TextTrackType.VTT,
    uri: `${SUBTITLE_BASE_URL}/chi-4.vtt`,
  },
  { title: 'Malay', language: 'ms', type: TextTrackType.VTT, uri: `${SUBTITLE_BASE_URL}/may-5.vtt` },
];

const videoSources: { title: string; source: ReactVideoProps['source'] }[] = [
  {
    title: 'HLS - Tears of Steel',
    source: {
      uri: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      textTracks: subtitleTracks,
    },
  },
  {
    title: 'MP4 - Big Buck Bunny',
    // Sidecar subtitles go on an MP4: on iOS, react-native-video ignores them for .m3u8 sources.
    source: {
      uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      textTracks: subtitleTracks,
    },
  },
  {
    title: 'DASH - Test Stream',
    source: { uri: 'https://dash.akamaized.net/dash264/TestCasesUHD/2b/11/MultiRate.mpd', textTracks: subtitleTracks },
  },
  {
    title: 'local MP4',
    source: { uri: require('../../../assets/test.mp4'), textTracks: subtitleTracks },
  },
  {
    title: 'local MP4 (Vertical)',
    source: { uri: require('../../../assets/vertical.mp4'), textTracks: subtitleTracks },
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

function Player({ source, title }: { source: ReactVideoProps['source']; title: string }) {
  const { state } = useVideo();

  return (
    <View style={state.fullscreen ? styles.fullscreenContainer : styles.playerContainer}>
      <VideoPlayer
        videoProps={{
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
    <VideoProvider portalHost={APP_PORTAL_HOST}>
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
