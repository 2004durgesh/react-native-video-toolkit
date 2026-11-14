import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useBuffering } from '../../hooks';
import { useVideoSelector, useVideoComponents } from '../../providers';
import { useTestID } from '../../utils/testIDs';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * Identifies the spinner in end-to-end tests, for example to wait until buffering ends.
   * @default `video-loading`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

/**
 * `LoadingSpinner` is a control component that displays an activity indicator
 * when the video is buffering. It automatically hides itself when buffering is not active.
 * The spinner's appearance can be customized via props and integrates with the player's theme.
 *
 * @param {LoadingSpinnerProps} props - The props for the LoadingSpinner component.
 * @returns {React.ReactElement | null} The `Spinner` from `VideoProvider`'s `components` (an `ActivityIndicator`
 * by default) if buffering, otherwise `null`.
 */
export const LoadingSpinner = ({
  size = 'large',
  color,
  style,
  testID,
}: LoadingSpinnerProps): React.ReactElement | null => {
  const spinnerTestID = useTestID('loading', testID);
  const { buffering } = useBuffering();
  const theme = useVideoSelector((state) => state.theme);
  const { Spinner } = useVideoComponents();

  const spinnerColor = color || theme.colors.spinner;

  if (!buffering) {
    return null;
  }

  return <Spinner size={size} color={spinnerColor} style={[styles.spinner, style]} testID={spinnerTestID} />;
};

const styles = StyleSheet.create({
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
});
