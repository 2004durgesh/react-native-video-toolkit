import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { useVideoSelector } from '../../providers';

/** Props for the Subtitle component. */
export interface SubtitleProps extends TextProps {
  text: string;
}

/** @deprecated Misspelt: use `SubtitleProps`. Will be removed in 2.0. */
export type SubitleProps = SubtitleProps;

/**
 * `Subtitle` is a display component used to render textual subtitles or secondary information.
 * It integrates with the video player's theme for consistent text styling.
 *
 * @param {SubtitleProps} props - The props for the Subtitle component.
 *
 * @returns {React.ReactElement} A Text component displaying the subtitle.
 */
export const Subtitle = ({ text, style, ...rest }: SubtitleProps): React.ReactElement => {
  const theme = useVideoSelector((state) => state.theme);
  return (
    <Text style={[styles.subtitle, { color: theme.colors.textMain }, style]} {...rest}>
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
