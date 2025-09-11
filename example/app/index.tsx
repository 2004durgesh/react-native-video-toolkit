import React from 'react';
import { DefaultLayout, ThemeProvider, minimalTheme } from 'react-native-video-toolkit';
import { ScreenLayout } from './components/ScreenLayout';

export default function Index() {
  return <ScreenLayout layout={<DefaultLayout title="Example Video" subtitle="react-native-video-toolkit" />} />;
}
