import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { useVideo } from '../../providers';

/**
 * `Title` is a display component used to render a prominent title or heading.
 * It integrates with the video player's theme for consistent text styling.
 *
 * @param {object} props - The props for the Title component.
 * @param {string} props.text - The text content of the title.
 * @param {StyleProp<TextStyle>} [props.style] - Optional style to apply to the title text.
 *
 * @returns {React.ReactElement} A Text component displaying the title.
 */
export const Title = ({ text, style }: { text: string; style?: StyleProp<TextStyle> }): React.ReactElement => {
  const {
    state: { theme },
  } = useVideo();
  return <Text style={[styles.title, { color: theme.colors.text }, style]}>{text}</Text>;
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
