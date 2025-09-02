import { Text, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useProgress } from '../../../hooks';
import { useVideo } from '../../../providers';

export interface TimeDisplayProps {
  type?: 'current' | 'duration' | 'both';
  fontSize?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * `TimeDisplay` is a control component that displays the current playback time
 * and/or the total duration of the video. It can be configured to show only
 * the current time, only the duration, or both.
 *
 * @param {TimeDisplayProps} props - The props for the TimeDisplay component.
 * @returns {React.ReactElement} A component that displays video time information.
 */
export const TimeDisplay = ({ type = 'both', fontSize = 14, color, style }: TimeDisplayProps): React.ReactElement => {
  const { currentTime, duration } = useProgress();
  const {
    state: { theme },
  } = useVideo();

  const textColor = color || theme.colors.text;

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, '0')}`;

  const renderTime = () => {
    switch (type) {
      case 'current':
        return <Text style={[styles.timeText, { fontSize, color: textColor }]}>{formatTime(currentTime)}</Text>;
      case 'duration':
        return <Text style={[styles.timeText, { fontSize, color: textColor }]}>{formatTime(duration)}</Text>;
      default:
        return (
          <>
            <Text style={[styles.timeText, { fontSize, color: textColor }]}>{formatTime(currentTime)}</Text>
            <Text style={[styles.separator, { fontSize, color: textColor }]}>{' / '}</Text>
            <Text style={[styles.timeText, { fontSize, color: textColor }]}>{formatTime(duration)}</Text>
          </>
        );
    }
  };

  return <View style={[styles.timeContainer, style]}>{renderTime()}</View>;
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
