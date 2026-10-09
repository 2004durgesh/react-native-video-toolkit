import React, { useState, type ComponentType } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Audio,
  Check,
  ChevronLeft,
  Close,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  PictureInPictureExit,
  Play,
  Quality,
  Settings,
  SkipNext,
  SkipPrevious,
  Speed,
  Subtitles,
  SubtitlesOff,
  VolumeOff,
  VolumeUp,
  type IconProps,
} from 'react-native-video-toolkit';

/**
 * Every toolkit icon in the player's white, on a white box: the hardest case for their drop shadow,
 * since the shadow is all that separates the icon from the background.
 */

const ICONS: { name: string; Icon: ComponentType<IconProps> }[] = [
  { name: 'Play', Icon: Play },
  { name: 'Pause', Icon: Pause },
  { name: 'SkipPrevious', Icon: SkipPrevious },
  { name: 'SkipNext', Icon: SkipNext },
  { name: 'VolumeUp', Icon: VolumeUp },
  { name: 'VolumeOff', Icon: VolumeOff },
  { name: 'Maximize', Icon: Maximize },
  { name: 'Minimize', Icon: Minimize },
  { name: 'PictureInPicture', Icon: PictureInPicture },
  { name: 'PictureInPictureExit', Icon: PictureInPictureExit },
  { name: 'Subtitles', Icon: Subtitles },
  { name: 'SubtitlesOff', Icon: SubtitlesOff },
  { name: 'Settings', Icon: Settings },
  { name: 'Speed', Icon: Speed },
  { name: 'Audio', Icon: Audio },
  { name: 'Quality', Icon: Quality },
  { name: 'Close', Icon: Close },
  { name: 'ChevronLeft', Icon: ChevronLeft },
  { name: 'Check', Icon: Check },
];

const SIZES = [18, 24, 32, 48];

// The player's icon color (`theme.colors.iconNormal`).
const ICON_COLOR = '#FAFAFA';

export default function IconsScreen() {
  const [shadow, setShadow] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Icons</Text>
        <Text style={styles.subtitle}>White icons on a white box, so the shadow does all the work.</Text>

        <View style={styles.toggle}>
          <Text style={styles.toggleLabel}>Shadow</Text>
          <Switch value={shadow} onValueChange={setShadow} />
        </View>

        <View style={styles.box}>
          {ICONS.map(({ name, Icon }) => (
            <View key={name} style={styles.cell}>
              <Icon size={32} color={ICON_COLOR} shadow={shadow} />
              <Text style={styles.label}>{name}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Sizes</Text>
        <View style={[styles.box, styles.sizesBox]}>
          {SIZES.map((size) => (
            <View key={size} style={styles.sizeCell}>
              <Play size={size} color={ICON_COLOR} shadow={shadow} />
              <Text style={styles.label}>{size}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#fff',
  },
  box: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
  },
  cell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 11,
    color: '#555',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginTop: 24,
    marginBottom: 8,
  },
  sizesBox: {
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  sizeCell: {
    alignItems: 'center',
  },
});
