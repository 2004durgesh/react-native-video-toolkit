import { Text, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useVideoSelector } from '../../providers';
import { useProgressValue } from '../../providers/ProgressStore';
import { useTestID } from '../../utils/testIDs';

export interface TimeDisplayProps {
  type?: 'current' | 'duration' | 'both';
  fontSize?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * Identifies the display in end-to-end tests. The current time and the duration inside it get
   * this followed by `-current` and `-duration`.
   * @default `video-time`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

/**
 * `TimeDisplay` is a control component that displays the current playback time
 * and/or the total duration of the video. It can be configured to show only
 * the current time, only the duration, or both.
 *
 * @param {TimeDisplayProps} props - The props for the TimeDisplay component.
 * @returns {React.ReactElement} A component that displays video time information.
 */
export const TimeDisplay = ({
  type = 'both',
  fontSize = 14,
  color,
  style,
  testID,
}: TimeDisplayProps): React.ReactElement => {
  const displayTestID = useTestID('time', testID);
  // Whole seconds, which is all the display shows, so it re-renders once a second instead of on every progress event
  const currentTime = useProgressValue((progress) => Math.floor(progress.currentTime));
  const theme = useVideoSelector((state) => state.theme);
  const duration = useVideoSelector((state) => state.duration);

  const textColor = color || theme.colors.textMain;

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    const minutes = Math.max(0, m);
    return `${minutes}:${s.toString().padStart(2, '0')}`;
  };

  const renderTime = () => {
    switch (type) {
      case 'current':
        return (
          <Text testID={`${displayTestID}-current`} style={[styles.timeText, { fontSize, color: textColor }]}>
            {formatTime(currentTime)}
          </Text>
        );
      case 'duration':
        return (
          <Text testID={`${displayTestID}-duration`} style={[styles.timeText, { fontSize, color: textColor }]}>
            {formatTime(duration)}
          </Text>
        );
      default:
        return (
          <>
            <Text testID={`${displayTestID}-current`} style={[styles.timeText, { fontSize, color: textColor }]}>
              {formatTime(currentTime)}
            </Text>
            <Text style={[styles.separator, { fontSize, color: textColor }]}>{' / '}</Text>
            <Text testID={`${displayTestID}-duration`} style={[styles.timeText, { fontSize, color: textColor }]}>
              {formatTime(duration)}
            </Text>
          </>
        );
    }
  };

  return (
    <View style={[styles.timeContainer, style]} testID={displayTestID}>
      {renderTime()}
    </View>
  );
};

export const styles = StyleSheet.create({
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  separator: {
    fontWeight: '400',
    opacity: 0.8,
  },
});
