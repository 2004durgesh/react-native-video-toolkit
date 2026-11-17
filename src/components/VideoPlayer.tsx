import React, { type FC, type ReactNode, useId, useMemo, useState } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle, Platform, type ViewProps } from 'react-native';
import {
  PlayButton,
  ProgressBar,
  VolumeControl,
  FullscreenButton,
  MuteButton,
  SettingsButton,
  SubtitleToggleButton,
  PictureInPictureButton,
  UpNext,
} from './controls';
import type { GestureHandlerProps, CustomVideoTrack } from '../types';
import { VideoSurface } from './core';
import type { ReactVideoProps, AudioTrack } from 'react-native-video';
import { GestureHandler } from '../gestures';
import { useVideoSelector } from '../providers';
import { TimeDisplay, LoadingSpinner, VideoOverlay } from './display';
import { getFullscreenHeight } from '../fullscreen/height';
import { Captions, CaptionsSlotContext, PlayerCaptions, createCaptionsSlot } from '../captions/Captions';
import { DevProfiler } from '../utils/DevProfiler';
import { useFullscreenExits } from '../fullscreen/useFullscreenExits';
import { PLAYER_ID_PREFIX } from '../fullscreen/playerId';
import { PLAYER_LAYERS } from './layers';
import { TVPlayerFocus } from '../tv/TVPlayerFocus';
import { PlatformUtils } from '../utils/platform';
import { DEFAULT_VIDEO_TEST_ID, TestIDContext, useTestID } from '../utils/testIDs';

/**
 * Props for the VideoPlayer component. Other `View` props go to the player's outer view, apart from
 * `id`, which the player sets itself.
 */
export interface VideoPlayerProps extends ViewProps {
  /**
   * The video to play, as react-native-video's `source`: a remote URL or a local file path.
   */
  source: ReactVideoProps['source'];
  /**
   * Children components to be rendered on top of the video player.
   * This can be used to add custom controls or overlays.
   */
  children?: ReactNode;
  /**
   * Style for the container of the video player.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Props to be passed to the underlying react-native-video component.
   * See https://github.com/react-native-video/react-native-video for more details.
   */
  videoProps?: ReactVideoProps;
  /**
   * Props to be passed to the GestureHandler component.
   */
  gestureProps?: GestureHandlerProps;
  /**
   * Style for the video itself. Takes the place of `videoProps.style`.
   */
  videoStyle?: ReactVideoProps['style'];
  /** Audio tracks to list instead of the source's own. Passing them turns them on. */
  customAudioTracks?: AudioTrack[];
  /**
   * Video qualities to list instead of the source's own, often with your own "Auto" entry. Passing
   * them turns them on.
   */
  customVideoTracks?: CustomVideoTrack[];
  /**
   * Identifies the player in end-to-end tests. Its parts' IDs start with it, so two players on a
   * screen don't share IDs: `video-play-button`, or `trailer-play-button` with `testID="trailer"`.
   * @default 'video'
   */
  testID?: string;
}

const VideoPlayerComponent = ({
  source,
  children,
  containerStyle,
  videoProps,
  gestureProps,
  videoStyle,
  customAudioTracks,
  customVideoTracks,
  testID = DEFAULT_VIDEO_TEST_ID,
  style,
  ...viewProps
}: VideoPlayerProps) => {
  // Each player's own id: web fullscreen finds the player around its video by this prefix, and a
  // shared id made the first player on the page go fullscreen whichever button was pressed
  const playerId = `${PLAYER_ID_PREFIX}-${useId()}`;
  const [captionsSlot] = useState(createCaptionsSlot);
  useFullscreenExits();
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  const height = useVideoSelector((state) =>
    state.fullscreen
      ? getFullscreenHeight(state.dimensions, state.config.enableScreenRotation)
      : state.videoLayout.height
  );

  // For web fullscreen, we need to adjust overflow to ensure controls are visible
  const innerViewStyle = useMemo(() => {
    const baseStyle = {
      overflow: 'hidden' as const,
    };

    if (Platform.OS === 'web') {
      return {
        ...baseStyle,
        flex: 1,
        position: 'relative' as const,
        ...(fullscreen && { overflow: 'visible' as const }),
      };
    }

    return baseStyle;
  }, [fullscreen]);

  return (
    <TestIDContext.Provider value={testID}>
      <CaptionsSlotContext.Provider value={captionsSlot}>
        <View
          {...viewProps}
          id={playerId}
          testID={testID}
          style={[
            {
              position: 'relative',
              height,
              ...(Platform.OS === 'web' && { width: '100%', height: '100%', overflow: 'hidden' }),
            },
            style,
            containerStyle,
          ]}>
          <GestureHandler {...gestureProps}>
            <View style={innerViewStyle}>
              <DevProfiler id="VideoSurface">
                <VideoSurface
                  {...videoProps}
                  source={source}
                  style={videoStyle ?? videoProps?.style}
                  customAudioTracks={customAudioTracks}
                  customVideoTracks={customVideoTracks}
                />
              </DevProfiler>
              {/* Subtitles the toolkit draws: over the video, under the layout's controls */}
              <PlayerCaptions />
              {PlatformUtils.isTV() ? <TVPlayerFocus>{children}</TVPlayerFocus> : children}
            </View>
          </GestureHandler>
        </View>
      </CaptionsSlotContext.Provider>
    </TestIDContext.Provider>
  );
};

/**
 * A container for video controls.
 * This component is used to group controls together and position them on top of the video.
 */
const VideoControls: FC<{
  children?: ReactNode;
  style?: any;
  /**
   * Identifies the controls in end-to-end tests.
   * @default `video-controls`, with the player's `testID` in place of `video`
   */
  testID?: string;
}> = ({ children, style, testID }) => {
  const controlsTestID = useTestID('controls', testID);
  return (
    <View style={[styles.controlsContainer, style]} testID={controlsTestID}>
      {children}
    </View>
  );
};

/**
 * Plays a video with the toolkit's gestures and subtitles, and renders its children over it: usually
 * `DefaultLayout`, or a layout of your own built from its parts (`VideoPlayer.PlayButton`,
 * `VideoPlayer.ProgressBar`...). Needs a `VideoProvider` above it.
 */
export const VideoPlayer = Object.assign(VideoPlayerComponent, {
  Controls: VideoControls,
  PlayButton,
  ProgressBar,
  TimeDisplay,
  VolumeControl,
  FullscreenButton,
  MuteButton,
  LoadingSpinner,
  SettingsButton,
  SubtitleToggleButton,
  PictureInPictureButton,
  UpNext,
  Overlay: VideoOverlay,
  Captions,
});

const styles = StyleSheet.create({
  controlsContainer: {
    ...StyleSheet.absoluteFill,
    ...(Platform.OS === 'web' && {
      zIndex: PLAYER_LAYERS.controls,
      pointerEvents: 'box-none',
    }),
  },
});
