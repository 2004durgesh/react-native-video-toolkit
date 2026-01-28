import React, { type FC, type ReactNode, useMemo } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle, Platform, type ViewProps } from 'react-native';
import {
  PlayButton,
  ProgressBar,
  VolumeControl,
  FullscreenButton,
  MuteButton,
  SettingsButton,
  SubtitleToggleButton,
} from './controls';
import type { GestureHandlerProps, CustomVideoTrack } from '../types';
import { VideoSurface } from './core';
import type { ReactVideoProps, AudioTrack } from 'react-native-video';
import { GestureHandler } from '../gestures';
import { useVideo } from '../providers';
import { TimeDisplay, LoadingSpinner } from './display';

/**
 * Props for the VideoPlayer component.
 */
interface VideoPlayerProps extends ViewProps {
  /**
   * The source of the video to be played.
   * This can be a remote URL or a local file path.
   * Extends the source prop from react-native-video.
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
   * Props to style the video component itself.
   */
  videoStyle?: ReactVideoProps['style'];
  /**
   * Custom audio tracks to use instead of auto-extracting from video source.
   * Only used when config.useCustomAudioTracks is true.
   */
  customAudioTracks?: AudioTrack[];
  /**
   * Custom video tracks to use instead of auto-extracting from video source.
   * Only used when config.useCustomVideoTracks is true.
   */
  customVideoTracks?: CustomVideoTrack[];
}

/**
 * The root component for the video player.
 * This component is responsible for rendering the video and handling user gestures.
 */
const VideoPlayerComponent = ({
  source,
  children,
  containerStyle,
  videoProps,
  gestureProps,
  videoStyle,
  customAudioTracks,
  customVideoTracks,
}: VideoPlayerProps) => {
  // this is the root of all the things :)
  const { state } = useVideo();

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
        ...(state.fullscreen && { overflow: 'visible' as const }),
      };
    }

    return baseStyle;
  }, [state.fullscreen]);

  return (
    <View
      id="video-player"
      style={[
        {
          position: 'relative',
          height: state.fullscreen ? state.videoLayout.width : state.videoLayout.height,
          ...(Platform.OS === 'web' && { width: '100%', height: '100%', overflow: 'hidden' }),
        },
        containerStyle,
      ]}>
      <GestureHandler {...gestureProps}>
        <View style={innerViewStyle}>
          <VideoSurface
            {...videoProps}
            source={source}
            style={videoStyle}
            customAudioTracks={customAudioTracks}
            customVideoTracks={customVideoTracks}
          />
          {children}
        </View>
      </GestureHandler>
    </View>
  );
};

/**
 * A container for video controls.
 * This component is used to group controls together and position them on top of the video.
 */
const VideoControls: FC<{ children?: ReactNode; style?: any }> = ({ children, style }) => {
  return <View style={[styles.controlsContainer, style]}>{children}</View>;
};

/**
 * The main VideoPlayer component with a compound component pattern.
 * This allows for a flexible and declarative API for building custom video player layouts.
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
});

const styles = StyleSheet.create({
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' && {
      zIndex: 10,
      pointerEvents: 'box-none',
    }),
  },
});
