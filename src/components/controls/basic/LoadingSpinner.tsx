import { ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useBuffering } from '../../../hooks';
import { useVideo } from '../../../providers';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * `LoadingSpinner` is a control component that displays an activity indicator
 * when the video is buffering. It automatically hides itself when buffering is not active.
 * The spinner's appearance can be customized via props and integrates with the player's theme.
 *
 * @param {object} props - The props for the LoadingSpinner component.
 * @param {'small' | 'large'} [props.size='large'] - The size of the activity indicator.
 * @param {string} [props.color] - The color of the activity indicator. Defaults to the primary color from the theme.
 * @param {StyleProp<ViewStyle>} [props.style] - Optional style to apply to the spinner container.
 *
 * @returns {React.ReactElement | null} An `ActivityIndicator` component if buffering, otherwise `null`.
 */
export const LoadingSpinner = ({ size = 'large', color, style }: LoadingSpinnerProps): React.ReactElement | null => {
  const { buffering } = useBuffering();
  const {
    state: { theme },
  } = useVideo();

  const spinnerColor = color || theme.colors.primary;

  if (!buffering) {
    return null;
  }

  return <ActivityIndicator size={size} color={spinnerColor} style={[styles.spinner, style]} />;
};

const styles = StyleSheet.create({
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
});
