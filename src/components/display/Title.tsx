import { Text, StyleSheet, type TextProps } from 'react-native';
import { useVideo } from '../../providers';

export interface TitleProps extends TextProps {
  text: string;
}

/**
 * `Title` is a display component used to render a prominent title or heading.
 * It integrates with the video player's theme for consistent text styling.
 *
 * @param {TitleProps} props - The props for the Title component.
 *
 * @returns {React.ReactElement} A Text component displaying the title.
 */
export const Title = ({ text, style, ...rest }: TitleProps): React.ReactElement => {
  const {
    state: { theme },
  } = useVideo();
  return (
    <Text style={[styles.title, { color: theme.colors.textMain }, style]} {...rest}>
      {text}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
