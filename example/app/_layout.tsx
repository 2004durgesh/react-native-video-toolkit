import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { Slot } from 'expo-router';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VideoProvider, useVideo } from 'react-native-video-toolkit';

function AppContent() {
  const { state } = useVideo();

  useEffect(() => {
    // Hide status bar in fullscreen mode
    StatusBar.setHidden(state.fullscreen);
  }, [state.fullscreen]);

  return <Slot />;
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.isTV) {
      RNOrientationDirector.lockTo(Orientation.landscape);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaProvider>
        <VideoProvider>
          <AppContent />
        </VideoProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
