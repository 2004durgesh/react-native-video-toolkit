import React from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { useVideo } from '../../providers';

/**
 * `Subtitle` is a display component used to render textual subtitles or secondary information.
 * It integrates with the video player's theme for consistent text styling.
 *
 * @param {object} props - The props for the Subtitle component.
 * @param {string} props.text - The text content of the subtitle.
 * @param {StyleProp<TextStyle>} [props.style] - Optional style to apply to the subtitle text.
 *
 * @returns {React.ReactElement} A Text component displaying the subtitle.
 */
export const Subtitle = ({ text, style }: { text: string; style?: StyleProp<TextStyle> }): React.ReactElement => {
  const {
    state: { theme },
  } = useVideo();
  return <Text style={[styles.subtitle, { color: theme.colors.text }, style]}>{text}</Text>;
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
});
