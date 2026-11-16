import React, { useMemo, useState } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Button } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextTrackType, type ReactVideoProps, type TextTracks } from 'react-native-video';
import { VideoPlayer, DefaultLayout, useVideoSelector, VideoProvider } from 'react-native-video-toolkit';
import { APP_PORTAL_HOST } from '../../constants';
import { useHideTabBarInFullscreen } from '../../components/useHideTabBarInFullscreen';
import { PerfProfiler, PerfRun } from '../../perf/perfHarness';

// Picture-in-picture needs native setup, so the button is opt-in (see the react-native-video plugin in app.json).
const PLAYER_CONFIG = { enablePictureInPicture: true };

// A remote subtitle file, from Akamai's caption test content for Elephants Dream. Its host allows
// cross-origin requests, so it loads on web too.
const remoteSubtitleTracks: TextTracks = [
  {
    title: 'English',
    language: 'en',
    type: TextTrackType.VTT,
    uri: 'https://dash.akamaized.net/akamai/test/caption_test/ElephantsDream/ElephantsDream_en.vtt',
  },
];

// Subtitle files bundled with the app. `require()` gives an asset number, which the toolkit loads;
// react-native-video's type only allows strings, hence the cast.
const bundled = (file: number) => file as unknown as string;
const localSubtitleTracks: TextTracks = [
  { title: 'English', language: 'en', type: TextTrackType.VTT, uri: bundled(require('../../assets/subtitles/en.vtt')) },
  { title: 'العربية', language: 'ar', type: TextTrackType.VTT, uri: bundled(require('../../assets/subtitles/ar.vtt')) },
  {
    title: 'हिन्दी',
    language: 'hi',
    type: TextTrackType.SUBRIP,
    uri: bundled(require('../../assets/subtitles/hi.srt')),
  },
];

const videoSources: { title: string; source: ReactVideoProps['source'] }[] = [
  {
    // Subtitle files bundled with the app, over a stream with no subtitles of its own
    title: 'HLS - Tears of Steel',
    source: {
      uri: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      textTracks: localSubtitleTracks,
    },
  },
  {
    // Subtitles from the stream's own WebVTT renditions, fetched and drawn by the toolkit
    title: 'HLS - Bipbop (subtitles)',
    source: {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    },
  },
  {
    // A remote subtitle file, fetched and drawn by the toolkit
    title: 'MP4 - Elephants Dream',
    source: {
      uri: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
      textTracks: remoteSubtitleTracks,
    },
  },
  {
    // Subtitles inside the stream (DASH), drawn by the video player
    title: 'DASH - Elephants Dream',
    source: {
      uri: 'https://dash.akamaized.net/akamai/test/caption_test/ElephantsDream/elephants_dream_480p_heaac5_1_https.mpd',
    },
  },
  {
    title: 'local MP4',
    source: { uri: require('../../../assets/test.mp4'), textTracks: localSubtitleTracks },
  },
  {
    title: 'local MP4 (Vertical)',
    source: { uri: require('../../../assets/vertical.mp4'), textTracks: localSubtitleTracks },
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

function Player({
  source,
  title,
  nextTitle,
  onPlayNext,
}: {
  source: ReactVideoProps['source'];
  title: string;
  /** The next source in the list, offered by the up-next card when this one ends. */
  nextTitle: string;
  onPlayNext: () => void;
}) {
  // Only `fullscreen`: useVideo() would re-render on every player state change, every tap included
  const fullscreen = useVideoSelector((state) => state.fullscreen);

  return (
    <View style={fullscreen ? styles.fullscreenContainer : styles.playerContainer}>
      <VideoPlayer
        videoProps={
          {
            // onLoad: (e) => console.log(e),
          }
        }
        source={source}
        // style={{height:1000}}
        containerStyle={fullscreen ? styles.fullscreenVideo : undefined}>
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
        <VideoPlayer.UpNext title={nextTitle} subtitle="Next in the list" onPlayNext={onPlayNext} />
      </VideoPlayer>
    </View>
  );
}

function HomeContent() {
  const [selectedVideo, setSelectedVideo] = useState(0);
  const currentVideo = videoSources[selectedVideo]!;
  // The up-next card plays the next source in the list, wrapping around at the end
  const nextIndex = (selectedVideo + 1) % videoSources.length;
  const nextVideo = videoSources[nextIndex]!;
  const playNext = () => setSelectedVideo(nextIndex);
  // Only `fullscreen`: useVideo() would re-render on every player state change, every tap included
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  useHideTabBarInFullscreen();

  // Fullscreen hides everything but the player, in the same tree: returning a different tree for
  // fullscreen remounted the player, which restarted the video from the beginning on every switch
  return (
    <PerfProfiler id="Screen">
      {/* Only does anything when Metro runs with EXPO_PUBLIC_PERF_RUN=1 (see perf/perfHarness.tsx) */}
      <PerfRun />
      <SafeAreaView style={fullscreen ? styles.fullscreenWrapper : styles.container} edges={fullscreen ? [] : ['top']}>
        <StatusBar hidden={fullscreen} barStyle="light-content" />

        {!fullscreen && (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Video Toolkit Test</Text>
              <Text style={styles.headerSubtitle}>Testing video playback features</Text>
            </View>

            {/* Video Source Selector */}
            <VideoSourceSelector selectedIndex={selectedVideo} onSelect={setSelectedVideo} />
          </>
        )}

        {/* Video Player */}
        <Player
          key={selectedVideo}
          source={currentVideo.source}
          title={currentVideo.title}
          nextTitle={nextVideo.title}
          onPlayNext={playNext}
        />

        {/* Info Section */}
        {!fullscreen && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Now Playing</Text>
            <Text style={styles.infoText}>{currentVideo.title}</Text>
            <Text style={styles.infoHint}>
              • Double tap sides to seek{'\n'}• Tap to show/hide controls{'\n'}• Use fullscreen button to test
              fullscreen
            </Text>
          </View>
        )}
      </SafeAreaView>
    </PerfProfiler>
  );
}

export default function HomeScreen() {
  // Subtitles keep clear of the notch in fullscreen, and the settings sheet of the navigation bar
  const insets = useSafeAreaInsets();
  const config = useMemo(() => ({ ...PLAYER_CONFIG, safeAreaInsets: insets }), [insets]);
  return (
    <VideoProvider portalHost={APP_PORTAL_HOST} config={config}>
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
    // The video's own shape: a fixed height cropped it on wide screens. On TV it leaves room for the rest.
    aspectRatio: 16 / 9,
    width: Platform.isTV ? '55%' : undefined,
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
