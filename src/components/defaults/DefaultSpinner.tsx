import { ActivityIndicator } from 'react-native';
import type { SpinnerProps } from '../../types';

/**
 * The toolkit's default `Spinner`, React Native's `ActivityIndicator`.
 *
 * @param {SpinnerProps} props - The props for the spinner.
 * @returns {React.ReactElement} The spinner component.
 */
export const DefaultSpinner = ({ size, color, style }: SpinnerProps): React.ReactElement => (
  <ActivityIndicator size={size} color={color} style={style} />
);
