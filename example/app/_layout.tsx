import { useEffect, useMemo, type ReactNode } from 'react';
import { Platform, StatusBar } from 'react-native';
import { Slot } from 'expo-router';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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

/** The app-wide player provider, with the safe-area insets subtitles and the settings sheet keep clear of. */
function RootVideoProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const config = useMemo(() => ({ safeAreaInsets: insets }), [insets]);
  return <VideoProvider config={config}>{children}</VideoProvider>;
}

export default function RootLayout() {
  useEffect(() => {
    // TV is landscape. Phones and tablets start in portrait (iOS lists landscape so fullscreen can
    // turn to it), and leaving fullscreen locks phones to portrait again.
    RNOrientationDirector.lockTo(Platform.isTV ? Orientation.landscape : Orientation.portrait);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaProvider>
        {/* At the root, above the tabs, so sheets aren't drawn under the tab bar. */}
        <BottomSheetModalProvider>
          <RootVideoProvider>
            <AppContent />
          </RootVideoProvider>
          <VideoPortalHost name={APP_PORTAL_HOST} />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
