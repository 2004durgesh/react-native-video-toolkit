import React, { type FC, type ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
  PlayButton,
  ProgressBar,
  TimeDisplay,
  VolumeControl,
  FullscreenButton,
  MuteButton,
  LoadingSpinner,
  SettingsButton,
} from './controls';
import type { GestureHandlerProps, VideoSource } from '../types';
import { VideoSurface } from './core';
import type { ReactVideoProps } from 'react-native-video';
import { GestureHandler } from '../gestures';
import { useVideo } from '../providers';
import { Menu } from './menu';

/**
 * Props for the VideoPlayer component.
 */
interface VideoPlayerProps {
  /**
   * The source of the video to be played.
   * This can be a remote URL or a local file path.
   * Extends the source prop from react-native-video.
   */
  source: VideoSource;
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
}

/**
 * The root component for the video player.
 * This component is responsible for rendering the video and handling user gestures.
 */
const VideoPlayerComponent = ({ source, children, containerStyle, videoProps, gestureProps }: VideoPlayerProps) => {
  // this is the root of all the things :)
  const { state } = useVideo();
  return (
    <View
      style={[
        { position: 'relative', height: state.fullscreen ? state.videoLayout.width : state.videoLayout.height },
        containerStyle,
      ]}>
      <GestureHandler {...gestureProps}>
        <View style={{ overflow: 'hidden' }}>
          <VideoSurface {...videoProps} source={source} />
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
  Menu,
});

const styles = StyleSheet.create({
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
