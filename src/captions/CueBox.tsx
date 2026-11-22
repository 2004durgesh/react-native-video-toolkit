import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import type { CaptionsTheme } from '../types/theme';
import type { Cue } from './types';

/** The text size for a picture this tall: `theme.fontSize`, or about 5.5% of the height for `'auto'`. */
export const fontSizeFor = (theme: CaptionsTheme, pictureHeight: number) =>
  theme.fontSize === 'auto' ? Math.min(28, Math.max(12, Math.round(pictureHeight * 0.055))) : theme.fontSize;

const OUTLINE_OFFSETS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;

/** One cue: its styled spans in a box, with an outline drawn as offset copies behind it. */
export const CueBox = ({
  cue,
  theme,
  fontSize,
  style,
  textStyle,
  testID,
}: {
  cue: Cue;
  theme: CaptionsTheme;
  fontSize: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID: string;
}) => {
  const baseText: TextStyle = {
    fontSize,
    lineHeight: Math.round(fontSize * theme.lineHeightMultiplier),
    color: theme.color,
    fontFamily: theme.fontFamily,
    fontWeight: theme.fontWeight,
    letterSpacing: theme.letterSpacing,
    textTransform: theme.textTransform,
    textAlign: theme.textAlign,
    writingDirection: cue.rtl ? 'rtl' : 'ltr',
  };
  const shadow: TextStyle | null = theme.shadowColor
    ? {
        textShadowColor: theme.shadowColor,
        textShadowOffset: theme.shadowOffset ?? { width: 1, height: 1 },
        textShadowRadius: theme.shadowRadius ?? 2,
      }
    : null;
  const spans = cue.spans.map((span, i) => (
    <Text
      key={i}
      style={[
        span.bold ? styles.bold : null,
        span.italic ? styles.italic : null,
        span.underline ? styles.underline : null,
      ]}>
      {span.text}
    </Text>
  ));

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: theme.backgroundColor,
          borderRadius: theme.borderRadius,
          paddingHorizontal: theme.paddingHorizontal,
          paddingVertical: theme.paddingVertical,
        },
        style,
      ]}
      testID={testID}>
      <View>
        {theme.outlineWidth > 0
          ? OUTLINE_OFFSETS.map(([dx, dy]) => (
              <Text
                key={`${dx}${dy}`}
                aria-hidden
                numberOfLines={theme.maxLines}
                style={[
                  baseText,
                  textStyle,
                  styles.outline,
                  {
                    color: theme.outlineColor,
                    transform: [{ translateX: dx * theme.outlineWidth }, { translateY: dy * theme.outlineWidth }],
                  },
                ]}>
                {spans}
              </Text>
            ))
          : null}
        <Text numberOfLines={theme.maxLines} style={[baseText, shadow, textStyle]} testID={`${testID}-text`}>
          {spans}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    alignSelf: 'center',
  },
  outline: {
    ...StyleSheet.absoluteFill,
  },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
});
