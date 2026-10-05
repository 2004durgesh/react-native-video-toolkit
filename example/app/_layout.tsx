import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { Slot } from 'expo-router';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { VideoPortalHost, VideoProvider, useVideo } from 'react-native-video-toolkit';
import { APP_PORTAL_HOST } from '../constants';

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
        {/* At the root, above the tabs, so sheets aren't drawn under the tab bar. */}
        <BottomSheetModalProvider>
          <VideoProvider>
            <AppContent />
          </VideoProvider>
          <VideoPortalHost name={APP_PORTAL_HOST} />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
