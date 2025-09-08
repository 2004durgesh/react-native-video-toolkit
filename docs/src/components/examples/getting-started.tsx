import React from 'react';
import { StyleSheet, View } from 'react-native';
//@ts-ignore
import { VideoPlayer, DefaultLayout, VideoProvider, defaultTheme } from 'react-native-video-toolkit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
function App() {
  const videoSource = {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <VideoProvider
        theme={defaultTheme}
        config={{
          onShowControls() {
            console.log('controls shown');
          },
          onHideControls() {
            console.log('controls hidden');
          },
          autoPlay: false,
        }}>
        <View style={styles.videoContainer}>
          <VideoPlayer containerStyle={{ height: '100%' }} source={videoSource}>
            <DefaultLayout title="Demo" subtitle="Video Player" />
          </VideoPlayer>
        </View>
      </VideoProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    aspectRatio: 16 / 9,
    backgroundColor: '#fff',
  },
});

export default App;
