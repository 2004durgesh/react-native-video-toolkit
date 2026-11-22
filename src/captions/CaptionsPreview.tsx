import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useVideoSelector } from '../providers';
import { CueBox, fontSizeFor } from './CueBox';
import type { Cue } from './types';

/**
 * Props for `CaptionsPreview`.
 */
export interface CaptionsPreviewProps {
  /** The sample subtitle. */
  text?: string;
  /**
   * The picture height that `fontSize: 'auto'` sizes for.
   * @default the window's shorter side, the picture's height in fullscreen
   */
  pictureHeight?: number;
  /** Styles for the view around the sample, which centres it. */
  style?: StyleProp<ViewStyle>;
  /**
   * Identifies the sample's box in end-to-end tests; its text is this followed by `-text`.
   * @default `captions-preview`
   */
  testID?: string;
}

/**
 * A sample subtitle drawn as the player draws subtitles, in the current `theme.captions`, for a
 * subtitle style setting to show its effect. Render it inside the `VideoProvider`.
 *
 * @param {CaptionsPreviewProps} props - The props for the component.
 * @returns {React.ReactElement} The sample subtitle.
 */
export const CaptionsPreview = ({
  text = 'The quick brown fox jumps over the lazy dog',
  pictureHeight,
  style,
  testID = 'captions-preview',
}: CaptionsPreviewProps): React.ReactElement => {
  const theme = useVideoSelector((state) => state.theme.captions);
  const window = useWindowDimensions();
  const fontSize = fontSizeFor(theme, pictureHeight ?? Math.min(window.width, window.height));
  const cue = useMemo<Cue>(() => ({ start: 0, end: 0, text, spans: [{ text }], rtl: false }), [text]);
  return (
    <View style={[styles.preview, style]}>
      <View style={{ maxWidth: `${theme.maxWidth * 100}%` }}>
        <CueBox cue={cue} theme={theme} fontSize={fontSize} testID={testID} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    pointerEvents: 'none',
  },
});
