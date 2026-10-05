import React, { useMemo, useState, type ComponentType } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  VideoPlayer,
  DefaultLayout,
  VideoProvider,
  useVideo,
  type SheetProps,
  type VideoComponents,
} from 'react-native-video-toolkit';
import { GorhomSheet } from '../../components/GorhomSheet';
import { NativeSheet } from '../../components/NativeSheet';
import { CommunitySlider } from '../../components/CommunitySlider';
import { RingSpinner } from '../../components/RingSpinner';
import { ScalePressFeedback } from '../../components/ScalePressFeedback';
import { APP_PORTAL_HOST } from '../../constants';

/**
 * Example of replacing the toolkit's internal components through `<VideoProvider components>`.
 *
 * - Sheet: hosts the settings menu (gear icon). Try `@gorhom/bottom-sheet` or the native sheet
 *   from `@expo/ui`.
 * - Slider, Spinner, PressFeedback: `@react-native-community/slider`, a Reanimated ring and a
 *   scale-on-press button.
 */

const SOURCE = {
  uri: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
};

type SheetChoice = 'default' | 'gorhom' | 'native';

const sheets: Record<SheetChoice, { label: string; component?: ComponentType<SheetProps> }> = {
  default: { label: 'Default' },
  gorhom: { label: '@gorhom/bottom-sheet', component: GorhomSheet },
  native: { label: '@expo/ui (native)', component: NativeSheet },
};

const customControls: Partial<VideoComponents> = {
  Slider: CommunitySlider,
  Spinner: RingSpinner,
  PressFeedback: ScalePressFeedback,
};

function Choice<T extends string>({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.choice}>
      <Text style={styles.choiceTitle}>{title}</Text>
      <View style={styles.choiceOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.option, option.value === selected && styles.optionActive]}
            onPress={() => onSelect(option.value)}>
            <Text style={[styles.optionText, option.value === selected && styles.optionTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ComponentsContent({
  sheet,
  onSheetChange,
  controls,
  onControlsChange,
}: {
  sheet: SheetChoice;
  onSheetChange: (sheet: SheetChoice) => void;
  controls: 'default' | 'custom';
  onControlsChange: (controls: 'default' | 'custom') => void;
}) {
  const { state } = useVideo();

  const player = (
    <View style={state.fullscreen ? styles.fullscreenContainer : styles.playerContainer}>
      <VideoPlayer source={SOURCE} containerStyle={state.fullscreen ? styles.fullscreenVideo : undefined}>
        <DefaultLayout title="Tears of Steel" subtitle="Custom components" />
      </VideoPlayer>
    </View>
  );

  if (state.fullscreen) {
    return (
      <View style={styles.fullscreenWrapper}>
        <StatusBar hidden />
        {player}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Custom Components</Text>
        <Text style={styles.headerSubtitle}>Bring your own sheet, slider, spinner and buttons</Text>
      </View>

      <Choice
        title="Menu sheet"
        options={(Object.keys(sheets) as SheetChoice[]).map((value) => ({ value, label: sheets[value].label }))}
        selected={sheet}
        onSelect={onSheetChange}
      />
      <Choice
        title="Slider, spinner and buttons"
        options={[
          { value: 'default', label: 'Default' },
          { value: 'custom', label: 'Custom' },
        ]}
        selected={controls}
        onSelect={onControlsChange}
      />

      {player}

      <Text style={styles.hint}>
        Open the menu with the gear icon to see the sheet, and drag the progress bar or volume slider to see the slider.
      </Text>
    </SafeAreaView>
  );
}

export default function ComponentsScreen() {
  const [sheet, setSheet] = useState<SheetChoice>('gorhom');
  const [controls, setControls] = useState<'default' | 'custom'>('custom');

  // Leaving a component out (or `undefined`) falls back to the toolkit's default.
  const components = useMemo<Partial<VideoComponents>>(
    () => ({
      Sheet: sheets[sheet].component,
      ...(controls === 'custom' ? customControls : {}),
    }),
    [sheet, controls]
  );

  // Both sheets open at the app root (gorhom's `BottomSheetModalProvider` and the toolkit's
  // `VideoPortalHost` live in `app/_layout.tsx`), outside this provider: the toolkit re-provides
  // its state inside the sheet, so the menu works wherever the sheet renders.
  return (
    <VideoProvider components={components} portalHost={APP_PORTAL_HOST}>
      <ComponentsContent sheet={sheet} onSheetChange={setSheet} controls={controls} onControlsChange={setControls} />
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
  choice: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  choiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  choiceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
  playerContainer: {
    height: 220,
    marginHorizontal: 16,
    marginTop: 4,
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
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
