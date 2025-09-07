import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Button } from 'react-native';
import {
  VideoPlayer,
  VideoProvider,
  useFullscreen,
  type VideoSource,
  useSettings,
  useSettingsContext,
} from '../../../src';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextTrackType } from 'react-native-video';

type Sample = {
  type: string;
  uri: string; // string for remote, number for require()
};

interface SampleSelectorProps {
  samples: Sample[];
  currentUri: string;
  onSelect: (uri: string) => void;
}

const SampleSelector: React.FC<SampleSelectorProps> = ({ samples, currentUri, onSelect }) => (
  <View style={styles.sampleSelector}>
    <Text style={styles.sampleSelectorTitle}>Choose a Sample</Text>
    {samples.map((sample, index) => {
      const isActive = sample.uri === currentUri;
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.sample,
            isActive && styles.activeSample, // highlight if playing
          ]}
          onPress={() => onSelect(sample.uri)}>
          <Text style={styles.sampleText}>{sample.type}</Text>
        </TouchableOpacity>
      );
    })}
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
      }}>
      <Link href="/" asChild>
        <Button title="Minimal" />
      </Link>
      {/* <Link href="/default" asChild>
        <Button title="Default" />
      </Link> */}
      <Link href="/custom" asChild>
        <Button title="Custom" />
      </Link>
    </View>
  </View>
);

const Main = ({ layout }: { layout: React.ReactNode }) => {
  const samples: Sample[] = [
    {
      type: 'mp4',
      uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      type: 'hls',
      uri: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    },
    {
      type: 'dash',
      uri: 'https://dash.akamaized.net/dash264/TestCasesUHD/2b/11/MultiRate.mpd',
    },
    { type: 'asset', uri: require('../../../assets/test.mp4') },
    { type: 'asset-vertical', uri: require('../../../assets/vertical.mp4') },
  ];
  const { fullscreen } = useFullscreen();
  const { state } = useSettingsContext();
  const [uri, setUri] = useState<string>(samples[1]?.uri!);
  const videoSource: VideoSource = {
    uri,
    textTracks: [
      {
        title: 'external',
        language: 'en',
        type: TextTrackType.VTT,
        uri: 'https://raw.githubusercontent.com/1c7/vtt-test-file/refs/heads/master/vtt%20files/4.%20No%20Hour.vtt',
      },
    ],
    textTracksAllowChunklessPreparation: false,
  };

  return (
    <>
      <VideoPlayer
        source={videoSource}
        containerStyle={styles.videoPlayer}
        videoProps={{
          onLoad(e) {
            console.log('Video Loaded!', e);
          },
          onLoadStart(e) {
            console.log('Video Load Started!', e);
          },
          // onVideoTracks(e) {
          //   console.log('video tracks changed', e);
          // },
          // onTextTracks(e) {
          //   console.log('text tracks changed', e);
          // },
          // onAudioTracks(e) {
          //   console.log('audio tracks changed', e);
          // },
        }}>
        {layout}
      </VideoPlayer>
      {!fullscreen && <SampleSelector samples={samples} currentUri={uri} onSelect={setUri} />}
      <Button title="settings state" onPress={() => console.log(state)} />
    </>
  );
};

export const ScreenLayout = ({ layout }: { layout: React.ReactNode }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'black' }}>
      <VideoProvider
        config={{
          onHideControls() {
            console.log('Controls hidden');
          },
          onShowControls() {
            console.log('Controls shown');
          },
        }}>
        <SafeAreaView edges={['top']}>
          <Main layout={layout} />
        </SafeAreaView>
      </VideoProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  videoPlayer: {
    backgroundColor: 'red',
  },
  sampleSelector: {
    marginTop: 20,
    width: '100%',
  },
  sampleSelectorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sample: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeSample: {
    borderColor: '#4da6ff',
  },
  sampleText: {
    color: '#fff',
    fontSize: 14,
  },
});
