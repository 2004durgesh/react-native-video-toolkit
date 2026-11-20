import {
  View,
  StyleSheet,
  type ColorValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { TextTrack } from 'react-native-video';
import { usePictureInPicture } from '../hooks';
import { useState, useSyncExternalStore, type FC, type ReactNode } from 'react';
import { Fade } from '../components/common/fade';
import { DevProfiler } from '../utils/DevProfiler';
import { useVideoSelector } from '../providers';
import { Subtitle, Title, VideoPlayer, type TitleProps, type SubtitleProps } from '../components';
import { SettingsMenu, type SettingsMenuSlots } from '../components/menu/SettingsMenu';
import { PlatformUtils } from '../utils/platform';
import { TRAP_FOCUS_HORIZONTAL } from '../tv/TVFocus';
import { usePlayerTestID } from '../utils/testIDs';

export interface DefaultLayoutProps {
  scrim?: boolean | ColorValue;
  title?: string;
  titleProps?: Omit<TitleProps, 'text'>;
  subtitle?: string;
  subtitleProps?: Omit<SubtitleProps, 'text'>;
  pinCaptionTrack?: (track: TextTrack) => boolean;
  slots?: {
    beforeTitle?: React.ReactElement;
    beforeSettingsButton?: React.ReactElement;
    afterSettingsButton?: React.ReactElement;
    beforeSubtitleToggleButton?: React.ReactElement;
    afterSubtitleToggleButton?: React.ReactElement;
    /**
     * Here, before is above the progress bar
     */
    beforeProgressBar?: React.ReactElement;
    /**
     * Here, after is below the progress bar
     */
    afterProgressBar?: React.ReactElement;
    beforeTimeDisplay?: React.ReactElement;
    afterTimeDisplay?: React.ReactElement;
    beforeMuteButton?: React.ReactElement;
    afterMuteButton?: React.ReactElement;
    beforePictureInPictureButton?: React.ReactElement;
    afterPictureInPictureButton?: React.ReactElement;
    beforeFullscreenButton?: React.ReactElement;
    afterFullscreenButton?: React.ReactElement;
    beforeCenterPlayButton?: React.ReactElement;
    afterCenterPlayButton?: React.ReactElement;
  } & SettingsMenuSlots;
}

/** The layout's frame and where its controls sit in it, measured as they lay out. */
const createControlsFrames = () => {
  let frames = { height: 0, bottomTop: 0, centerBottom: 0 };
  const listeners = new Set<() => void>();
  return {
    get: () => frames,
    set: (next: Partial<typeof frames>) => {
      const merged = { ...frames, ...next };
      if (
        merged.height === frames.height &&
        merged.bottomTop === frames.bottomTop &&
        merged.centerBottom === frames.centerBottom
      )
        return;
      frames = merged;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/**
 * The layout's subtitles: over the scrim, lifted above the bottom controls while they show, and
 * hidden when they don't fit under the play button. It re-renders as the frames change, not the
 * layout.
 */
const LayoutCaptions = ({ frames }: { frames: ReturnType<typeof createControlsFrames> }) => {
  const { height, bottomTop, centerBottom } = useSyncExternalStore(frames.subscribe, frames.get, frames.get);
  return (
    <VideoPlayer.Captions
      controlsInset={height ? Math.round(height - bottomTop) : 0}
      centerControlsInset={height && centerBottom ? Math.round(height - centerBottom) : 0}
    />
  );
};

/**
 * Fades and slides a group of controls with the controls' visibility. These wrappers are the only
 * part of the layout that reads `controlsVisible`, so a tap re-renders them but not the controls
 * inside: those are elements the layout already created.
 */
const FadingControls = ({
  offsetY = 0,
  style,
  testID,
  onLayout,
  children,
}: {
  onLayout?: (event: LayoutChangeEvent) => void;
  /** How far the group slides out when hidden. */
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode;
}) => {
  const shown = useVideoSelector((state) => state.controlsVisible);
  return (
    <Fade shown={shown} offsetY={offsetY} style={style} testID={testID} onLayout={onLayout}>
      {children}
    </Fade>
  );
};

/** Renders the children only while not buffering, reading `buffering` itself so the layout doesn't. */
const UnlessBuffering = ({ children }: { children: ReactNode }) => {
  const buffering = useVideoSelector((state) => state.buffering);
  return buffering ? null : <>{children}</>;
};

/**
 * Renders the children only where picture-in-picture works, reading that itself so the layout doesn't
 * re-render as picture-in-picture starts and stops.
 */
const WhenPictureInPictureSupported = ({ children }: { children: ReactNode }) => {
  const { supported } = usePictureInPicture();
  return supported ? <>{children}</> : null;
};

/**
 * A predefined layout for the video player.
 *
 * @param {DefaultLayoutProps} props - The props for the component.
 * @returns {React.ReactElement} The default layout component.
 */
export const DefaultLayout: FC<DefaultLayoutProps> = ({
  scrim = true,
  title,
  titleProps,
  subtitle,
  subtitleProps,
  pinCaptionTrack,
  slots,
}: DefaultLayoutProps): React.ReactElement => {
  const playIconSize = useVideoSelector((state) => state.theme.iconSizes.lg);
  const enablePictureInPicture = useVideoSelector((state) => state.config.enablePictureInPicture);
  const enableFullscreen = useVideoSelector((state) => state.config.enableFullscreen);
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  // Where the controls sit, so the layout's subtitles go between the centre and bottom controls
  const [frames] = useState(createControlsFrames);
  // IDs for end-to-end tests start with the player's `testID`: `video-controls-top`
  const id = usePlayerTestID();

  return (
    <DevProfiler id="DefaultLayout">
      <>
        <View style={[styles.baseStyle, { pointerEvents: 'box-none' }]}>
          {scrim ? (
            <VideoPlayer.Overlay
              withControls
              scrim={scrim}
              pointerEvents="none"
              // Under the layout's controls, though overlays otherwise sit above them
              style={layoutStyles.underControls}
              testID={`${id}-scrim`}
            />
          ) : null}
          {/* Above the scrim, so subtitles aren't dimmed, and under the controls */}
          <LayoutCaptions frames={frames} />
          <VideoPlayer.Controls>
            <View
              style={[layoutStyles.column, { height: '100%', paddingHorizontal: 15 }]}
              onLayout={(event) => frames.set({ height: event.nativeEvent.layout.height })}>
              <FadingControls
                offsetY={-50}
                testID={`${id}-controls-top`}
                style={[
                  layoutStyles.topControls,
                  layoutStyles.row,
                  { padding: fullscreen ? 20 : 10, justifyContent: 'space-between' },
                ]}>
                <View style={[layoutStyles.row, styles.titleRow]}>
                  {slots?.beforeTitle && slots.beforeTitle}
                  <View style={styles.titleColumn}>
                    {title && <Title text={title} testID={`${id}-title`} {...titleProps} />}
                    {subtitle && <Subtitle text={subtitle} testID={`${id}-subtitle`} {...subtitleProps} />}
                  </View>
                </View>
                <View style={[layoutStyles.row]}>
                  <View style={[layoutStyles.row]}>
                    {slots?.beforeSubtitleToggleButton && slots.beforeSubtitleToggleButton}
                    <VideoPlayer.SubtitleToggleButton />
                    {slots?.afterSubtitleToggleButton && slots.afterSubtitleToggleButton}
                  </View>
                  <View style={[layoutStyles.row]}>
                    {slots?.beforeSettingsButton && slots.beforeSettingsButton}
                    <DevProfiler id="Menu">
                      <SettingsMenu pinCaptionTrack={pinCaptionTrack} slots={slots} />
                    </DevProfiler>
                    {slots?.afterSettingsButton && slots.afterSettingsButton}
                  </View>
                </View>
              </FadingControls>
              {/* A full-size wrapper centres the play button, so the group's own frame, measured for
                the subtitles, is just the button */}
              <View style={layoutStyles.centerControls}>
                <FadingControls
                  testID={`${id}-controls-center`}
                  onLayout={(event) => {
                    const { y, height } = event.nativeEvent.layout;
                    frames.set({ centerBottom: y + height });
                  }}>
                  <UnlessBuffering>
                    {/* On TV, left and right stay on the centre controls rather than leaving the player */}
                    <View
                      style={layoutStyles.row}
                      collapsable={false}
                      {...(PlatformUtils.isTV() ? TRAP_FOCUS_HORIZONTAL : null)}>
                      {slots?.beforeCenterPlayButton && slots.beforeCenterPlayButton}
                      <DevProfiler id="PlayButton">
                        <VideoPlayer.PlayButton size={playIconSize} />
                      </DevProfiler>
                      {slots?.afterCenterPlayButton && slots.afterCenterPlayButton}
                    </View>
                  </UnlessBuffering>
                </FadingControls>
              </View>
              <FadingControls
                offsetY={50}
                testID={`${id}-controls-bottom`}
                // Where its top edge sits, so subtitles move up above it while it shows
                onLayout={(event) => frames.set({ bottomTop: event.nativeEvent.layout.y })}
                style={[
                  layoutStyles.bottomControls,
                  {
                    padding: fullscreen ? 20 : 10,
                  },
                ]}>
                <View style={[layoutStyles.column]}>
                  {slots?.beforeProgressBar && slots.beforeProgressBar}
                  <DevProfiler id="ProgressBar">
                    <VideoPlayer.ProgressBar />
                  </DevProfiler>
                  {slots?.afterProgressBar && slots.afterProgressBar}
                </View>
                <View style={layoutStyles.row}>
                  <View style={layoutStyles.row}>
                    {slots?.beforeTimeDisplay && slots.beforeTimeDisplay}
                    <DevProfiler id="TimeDisplay">
                      <VideoPlayer.TimeDisplay />
                    </DevProfiler>
                    {slots?.afterTimeDisplay && slots.afterTimeDisplay}
                  </View>
                  <View style={layoutStyles.spacer} />
                  <View style={[layoutStyles.row]}>
                    {enablePictureInPicture && (
                      <WhenPictureInPictureSupported>
                        <View style={[layoutStyles.row]}>
                          {slots?.beforePictureInPictureButton && slots.beforePictureInPictureButton}
                          <VideoPlayer.PictureInPictureButton />
                          {slots?.afterPictureInPictureButton && slots.afterPictureInPictureButton}
                        </View>
                      </WhenPictureInPictureSupported>
                    )}
                    <View style={[layoutStyles.row]}>
                      {slots?.beforeFullscreenButton && slots.beforeFullscreenButton}
                      {enableFullscreen && <VideoPlayer.FullscreenButton />}
                      {slots?.afterFullscreenButton && slots.afterFullscreenButton}
                    </View>
                    <View style={[layoutStyles.row]}>
                      {slots?.beforeMuteButton && slots.beforeMuteButton}
                      <VideoPlayer.MuteButton />
                      {slots?.afterMuteButton && slots.afterMuteButton}
                    </View>
                  </View>
                </View>
              </FadingControls>
            </View>
          </VideoPlayer.Controls>
        </View>
        {/* The spinner shows itself only while buffering */}
        <View style={[styles.baseStyle, { pointerEvents: 'none' }]}>
          <VideoPlayer.LoadingSpinner />
        </View>
      </>
    </DevProfiler>
  );
};

/** Where DefaultLayout puts its controls: bars at the top and bottom, the play button centred. */
const layoutStyles = StyleSheet.create({
  underControls: { zIndex: 0 },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  centerControls: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 9999,
  },
  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  column: { flexDirection: 'column' },
  spacer: { flex: 1 },
});

const styles = StyleSheet.create({
  baseStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexShrink: 1,
    gap: 8,
  },
  titleColumn: {
    flexShrink: 1,
  },
});
