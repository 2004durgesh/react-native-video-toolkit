import { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Slot } from 'expo-router';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { VideoProvider } from 'react-native-video-toolkit';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.isTV) {
      RNOrientationDirector.lockTo(Orientation.landscape);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <VideoProvider>
          <Slot />
        </VideoProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
