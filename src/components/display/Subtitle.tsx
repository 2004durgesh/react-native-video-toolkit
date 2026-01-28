import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { useVideo } from '../../providers';

export interface SubitleProps extends TextProps {
  text: string;
}

/**
 * `Subtitle` is a display component used to render textual subtitles or secondary information.
 * It integrates with the video player's theme for consistent text styling.
 *
 * @param {SubitleProps} props - The props for the Subtitle component.
 *
 * @returns {React.ReactElement} A Text component displaying the subtitle.
 */
export const Subtitle = ({ text, style, ...rest }: SubitleProps): React.ReactElement => {
  const {
    state: { theme },
  } = useVideo();
  return (
    <Text style={[styles.subtitle, { color: theme.colors.text }, style]} {...rest}>
      {text}
    </Text>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
});
