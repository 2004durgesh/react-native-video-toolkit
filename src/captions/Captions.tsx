import React, {
  Component,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useVideoSelector } from '../providers';
import type { CaptionsTheme } from '../types/theme';
import { DevProfiler } from '../utils/DevProfiler';
import { PlatformUtils } from '../utils/platform';
import { useTestID } from '../utils/testIDs';
import { useCaptionsController } from './CaptionsController';
import type { Cue } from './types';

/**
 * Props for `VideoPlayer.Captions`.
 */
export interface CaptionsProps {
  /** Styles for the box around each cue, over `theme.captions`. */
  style?: StyleProp<ViewStyle>;
  /** Styles for the text, over `theme.captions`. */
  textStyle?: StyleProp<TextStyle>;
  /**
   * How far your controls reach up from the player's bottom edge while visible, so subtitles stay
   * above them.
   */
  controlsInset?: number;
  /**
   * How far up from the player's bottom edge your centre controls (a play button) start while
   * visible. Subtitles that don't fit between them and the bottom controls hide until the controls
   * do.
   */
  centerControlsInset?: number;
  /**
   * Identifies the subtitles in end-to-end tests. Each cue on screen gets this followed by
   * `-cue-0`, `-cue-1`..., and its text that followed by `-text`.
   * @default `video-captions`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

/** Room kept between subtitles and the controls above which they sit. */
const CONTROLS_GAP = 8;
const LIFT_DURATION = 150;

type Size = { width: number; height: number };

/**
 * The visible picture inside the video box, as the video's `resizeMode` draws it. A picture larger
 * than the box (`cover`, or `none` with a big video) is cut to the box, as the video itself is.
 */
const pictureRect = (box: Size, natural: Size, resizeMode: 'none' | 'contain' | 'cover' | 'stretch') => {
  if (resizeMode === 'stretch' || natural.width <= 0 || natural.height <= 0 || box.width <= 0 || box.height <= 0) {
    return { x: 0, y: 0, width: box.width, height: box.height };
  }
  const fit = { contain: Math.min, cover: Math.max, none: () => 1 }[resizeMode];
  const scale = fit(box.width / natural.width, box.height / natural.height);
  const width = Math.min(box.width, natural.width * scale);
  const height = Math.min(box.height, natural.height * scale);
  return { x: (box.width - width) / 2, y: (box.height - height) / 2, width, height };
};

const fontSizeFor = (theme: CaptionsTheme, pictureHeight: number) =>
  theme.fontSize === 'auto' ? Math.min(28, Math.max(12, Math.round(pictureHeight * 0.055))) : theme.fontSize;

const OUTLINE_OFFSETS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;

/** One cue: its styled spans in a box, with an outline drawn as offset copies behind it. */
const CueBox = ({
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

/** Moves the subtitles up over the controls, animated on native. On web it jumps, as Reanimated's
 * web styles have been unreliable there. */
const Lift = ({
  lift,
  style,
  onLayout,
  children,
}: {
  lift: number;
  style: StyleProp<ViewStyle>;
  onLayout: (event: LayoutChangeEvent) => void;
  children: ReactNode;
}) => {
  const offset = useSharedValue(lift);
  useEffect(() => {
    offset.value = withTiming(lift, { duration: LIFT_DURATION });
  }, [lift, offset]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value > 0 ? -offset.value : 0 }] }));
  if (PlatformUtils.isWeb()) {
    return (
      <View style={[style, { transform: [{ translateY: lift > 0 ? -lift : 0 }] }]} onLayout={onLayout}>
        {children}
      </View>
    );
  }
  return (
    <Animated.View style={[style, animated]} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
};

const CaptionsLayer = ({ style, textStyle, controlsInset, centerControlsInset, testID }: CaptionsProps) => {
  const captions = useCaptionsController();
  // Re-renders only when the cues on screen change
  const cues = useSyncExternalStore(captions.subscribe, captions.getActive, captions.getActive);
  const layerTestID = useTestID('captions', testID);
  // The layer covers the player, so its size is the video box's. Measured here rather than read from
  // the video, which doesn't report its layout on web.
  const [box, setBox] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((previous) => (isSameSize(previous, { width, height }) ? previous : { width, height }));
  };
  // The cues' own height, to tell whether they fit under the centre controls
  const [stackHeight, setStackHeight] = useState(0);
  const onStackLayout = (event: LayoutChangeEvent) => {
    const height = Math.round(event.nativeEvent.layout.height);
    setStackHeight((previous) => (previous === height ? previous : height));
  };
  const natural = useVideoSelector((state) => state.naturalSize);
  const resizeMode = useVideoSelector((state) => state.resizeMode);
  const controlsVisible = useVideoSelector((state) => state.controlsVisible);
  // Safe areas only matter in fullscreen; inline, the player isn't at the screen's edges
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  const safeArea = useVideoSelector((state) => state.config.safeAreaInsets);
  const insets = fullscreen ? safeArea : undefined;
  const theme = useVideoSelector((state) => state.theme.captions);

  const picture = pictureRect(box, natural, resizeMode);
  const fontSize = fontSizeFor(theme, picture.height);
  const lineHeight = Math.round(fontSize * theme.lineHeightMultiplier);
  const barBelow = Math.max(0, box.height - (picture.y + picture.height));
  const margin = picture.height * theme.bottomMargin;
  const fitsInBar = barBelow >= lineHeight + theme.paddingVertical * 2 + 4;
  // From the video box's bottom edge: on the picture, or centred in the black bar under it
  const bottom =
    (theme.position === 'bars' && fitsInBar
      ? Math.max(2, (barBelow - lineHeight - theme.paddingVertical * 2) / 2)
      : barBelow + margin) + (insets?.bottom ?? 0);
  const inset = controlsInset ?? 0;
  const lift = controlsVisible && inset > 0 ? Math.max(0, inset + CONTROLS_GAP - bottom) : 0;
  // Lifted, the cues must still end below the centre controls; when there's no room (a small
  // player), they hide while the controls show rather than sit under the play button
  const centerInset = centerControlsInset ?? 0;
  const blocked =
    controlsVisible &&
    centerInset > 0 &&
    (stackHeight === 0 || bottom + lift + stackHeight + CONTROLS_GAP > centerInset);
  const left = picture.x + (insets?.left ?? 0);
  const width = Math.max(0, picture.width - (insets?.left ?? 0) - (insets?.right ?? 0));
  const maxWidth = width * theme.maxWidth;

  return (
    <View style={styles.layer} testID={layerTestID} onLayout={onLayout}>
      {cues.length > 0 && width > 0 ? (
        <Lift
          lift={lift}
          style={[styles.cues, { bottom, left, width }, blocked ? styles.hidden : styles.shown]}
          onLayout={onStackLayout}>
          {cues.map((cue, i) => (
            <View key={`${cue.start}-${cue.end}-${i}`} style={{ maxWidth }}>
              <CueBox
                cue={cue}
                theme={theme}
                fontSize={fontSize}
                style={style}
                textStyle={textStyle}
                testID={`${layerTestID}-cue-${i}`}
              />
            </View>
          ))}
        </Lift>
      ) : null}
    </View>
  );
};

const isSameSize = (a: { width: number; height: number }, b: { width: number; height: number }) =>
  a.width === b.width && a.height === b.height;

/**
 * Renders nothing if the subtitles fail to render, so a subtitle problem never takes the video
 * down with it. A new `resetKey` (the next cues) tries again, so one bad cue doesn't turn subtitles
 * off for good.
 */
class CaptionsBoundary extends Component<
  { resetKey: string; children: ReactNode },
  { failed: boolean; failedKey: string | null }
> {
  state = { failed: false, failedKey: null as string | null };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: { resetKey: string }, state: { failed: boolean; failedKey: string | null }) {
    if (!state.failed) return null;
    if (state.failedKey === null) return { failedKey: props.resetKey };
    return state.failedKey === props.resetKey ? null : { failed: false, failedKey: null };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) console.warn('[react-native-video-toolkit] Subtitles failed to render:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const CaptionsRenderer = (props: CaptionsProps): React.ReactElement | null => {
  const renderer = useVideoSelector((state) => state.config.captionRenderer);
  const captions = useCaptionsController();
  const cues = useSyncExternalStore(captions.subscribe, captions.getActive, captions.getActive);
  if (renderer === 'native') return null;
  return (
    <CaptionsBoundary resetKey={cues.map((cue) => `${cue.start}-${cue.end}`).join(',')}>
      <DevProfiler id="Captions">
        <CaptionsLayer {...props} />
      </DevProfiler>
    </CaptionsBoundary>
  );
};

/**
 * Whether a layout draws the player's subtitles: a mounted `<VideoPlayer.Captions>` claims them, and
 * the player's own layer steps aside, so they're never drawn twice. One per `VideoPlayer`.
 * @internal
 */
export const createCaptionsSlot = () => {
  let claims = 0;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    isClaimed: () => claims > 0,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    claim: () => {
      claims += 1;
      notify();
      return () => {
        claims -= 1;
        notify();
      };
    },
  };
};

/** @internal */
export const CaptionsSlotContext = createContext<ReturnType<typeof createCaptionsSlot> | null>(null);

const unclaimed = () => false;
const noSubscription = () => () => {};

/**
 * The player's own subtitle layer, which `VideoPlayer` renders under its children. It steps aside
 * when the layout renders `<VideoPlayer.Captions>`.
 * @internal
 */
export const PlayerCaptions = (): React.ReactElement | null => {
  const slot = useContext(CaptionsSlotContext);
  const claimed = useSyncExternalStore(
    slot?.subscribe ?? noSubscription,
    slot?.isClaimed ?? unclaimed,
    slot?.isClaimed ?? unclaimed
  );
  return claimed ? null : <CaptionsRenderer />;
};

/**
 * The subtitles the toolkit draws. `VideoPlayer` draws them in every layout; render this in your
 * layout to place them yourself (above a scrim, under your controls) or to pass insets and styles.
 * It then replaces the player's own, with `config.captionRenderer` left as `'custom'`.
 *
 * @param {CaptionsProps} props - The props for the component.
 * @returns {React.ReactElement | null} The subtitle layer, or nothing with the native renderer.
 */
export const Captions = (props: CaptionsProps): React.ReactElement | null => {
  const slot = useContext(CaptionsSlotContext);
  // Before paint, so the player's own layer never draws for a frame alongside this one
  useLayoutEffect(() => slot?.claim(), [slot]);
  return <CaptionsRenderer {...props} />;
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
  cues: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  box: {
    alignSelf: 'center',
  },
  // Set both ways: an animated view can keep a removed opacity
  hidden: {
    opacity: 0,
  },
  shown: {
    opacity: 1,
  },
  outline: {
    ...StyleSheet.absoluteFill,
  },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
});
