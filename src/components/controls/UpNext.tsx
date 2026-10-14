import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useVideoSelector } from '../../providers';
import { BaseButton } from '../common';
import { VideoOverlay } from '../display/VideoOverlay';

/**
 * Text shown on the card, for translations.
 */
export interface UpNextLabels {
  heading: string;
  playNow: string;
  cancel: string;
  playingIn: (seconds: number) => string;
}

export interface UpNextProps {
  /**
   * What plays next, for example `"EP 6 · After Rain"`.
   */
  title: string;
  /**
   * A second line under the title.
   */
  subtitle?: string;
  /**
   * Seconds to count down before `onPlayNext` is called. `0` plays the next source as soon as this one ends.
   * @default 5
   */
  countdown?: number;
  /**
   * Called when the countdown runs out or "Play now" is pressed. Load the next source here.
   */
  onPlayNext: () => void;
  /**
   * Called when the card is dismissed with "Cancel".
   */
  onCancel?: () => void;
  /**
   * Replaces any of the card's text.
   */
  labels?: Partial<UpNextLabels>;
  /**
   * Styles for the full-size overlay.
   */
  style?: StyleProp<ViewStyle>;
}

/** Darker than the controls' tint, since the card covers the video. */
const CARD_SCRIM = 'rgba(0, 0, 0, 0.7)';

const DEFAULT_LABELS: UpNextLabels = {
  heading: 'Up next',
  playNow: 'Play now',
  cancel: 'Cancel',
  playingIn: (seconds) => `Playing in ${seconds}s`,
};

/**
 * A card over the player that counts down to the next source once the current one ends, with "Cancel" and
 * "Play now". Render it inside `VideoPlayer`, after the layout, and only when there is something to play next.
 *
 * Each ending starts a fresh countdown. Playing again (the player rewinds when a source ends) or loading a new
 * source hides it.
 *
 * @param {UpNextProps} props - The props for the component.
 * @returns {React.ReactElement} The card, built on `VideoPlayer.Overlay`; hidden until the source ends.
 */
export const UpNext = ({
  title,
  subtitle,
  countdown = 5,
  onPlayNext,
  onCancel,
  labels,
  style,
}: UpNextProps): React.ReactElement => {
  const ended = useVideoSelector((state) => state.ended);
  const theme = useVideoSelector((state) => state.theme);
  const [dismissed, setDismissed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(countdown);

  const [wasEnded, setWasEnded] = useState(ended);
  if (ended !== wasEnded) {
    setWasEnded(ended);
    setDismissed(false);
    setSecondsLeft(countdown);
  }
  const visible = ended && !dismissed;

  // The latest callback, so a parent passing a new function each render doesn't restart the timer
  const onPlayNextRef = useRef(onPlayNext);
  useEffect(() => {
    onPlayNextRef.current = onPlayNext;
  });

  useEffect(() => {
    if (!visible) return;
    if (secondsLeft <= 0) {
      setDismissed(true);
      onPlayNextRef.current();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, secondsLeft]);

  const text = { ...DEFAULT_LABELS, ...labels };
  const playNow = () => {
    setDismissed(true);
    onPlayNext();
  };
  const cancel = () => {
    setDismissed(true);
    onCancel?.();
  };

  return (
    // Stays mounted while hidden so it can fade out; the overlay takes no taps then
    <VideoOverlay visible={visible} scrim={CARD_SCRIM} pointerEvents="auto" style={[styles.card, style]}>
      <Text style={[styles.heading, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }]}>
        {text.heading}
      </Text>
      <Text style={[styles.title, { color: theme.colors.textMain, fontSize: theme.fontSizes.lg }]} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[styles.centered, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.md }]}
          numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
        {text.playingIn(secondsLeft)}
      </Text>
      <View style={styles.actions}>
        <BaseButton onTap={cancel} style={[styles.button, { borderColor: theme.colors.menuBorder }]}>
          <Text style={[styles.buttonLabel, { color: theme.colors.textMain, fontSize: theme.fontSizes.md }]}>
            {text.cancel}
          </Text>
        </BaseButton>
        <BaseButton
          onTap={playNow}
          style={[styles.button, { backgroundColor: theme.colors.iconActive, borderColor: theme.colors.iconActive }]}>
          <Text style={[styles.buttonLabel, { color: theme.colors.textMain, fontSize: theme.fontSizes.md }]}>
            {text.playNow}
          </Text>
        </BaseButton>
      </View>
    </VideoOverlay>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
    ...(Platform.OS === 'web' && { zIndex: 20 }),
  },
  heading: {
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontWeight: '600',
  },
});

export default UpNext;
