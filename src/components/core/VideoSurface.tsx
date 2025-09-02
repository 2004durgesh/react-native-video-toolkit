import RNVideo, {
  ResizeMode,
  SelectedTrackType,
  SelectedVideoTrackType,
  ViewType,
  type OnLoadData,
  type ReactVideoProps,
} from 'react-native-video';
import { useEffect, useMemo, useRef, type FC } from 'react';
import { Dimensions, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import type { VideoSource } from '../../types';
import { useVideo } from '../../providers';
import { usePlayback, useVolume, useProgress, useBuffering, useControlsVisibility, useSettings } from '../../hooks';
import { combineHandlers, dedupeTracks } from '../../utils';

/**
 * Props for the VideoSurface component.
 */
interface VideoSurfaceProps extends ReactVideoProps {
  /**
   * The source of the video to be played.
   * This can be a remote URL or a local file path.
   */
  source: VideoSource;
  /**
   * Style for the container of the video player.
   */
  style?: ReactVideoProps['style'];
}

/**
 * A component that wraps the `react-native-video` library
 * and provides a simple interface for playing videos.
 *
 * This component is responsible for handling video playback,
 * events, and other video-related functionality.
 */
export const VideoSurface: FC<VideoSurfaceProps> = ({ source, style, ...rest }) => {
  const internalVideoRef = useRef(null);
  const { dispatch, state } = useVideo();
  const { isPlaying, setPlaying } = usePlayback();
  const { muted, volume } = useVolume();
  const { setCurrentTime, setDuration, seek } = useProgress();
  const { setBuffering } = useBuffering();
  const { showControls } = useControlsVisibility();
  const { playbackRate } = state;
  const { videoTrack, audioTrack, textTrack, getVideoTracks, getAudioTracks, getTextTracks } = useSettings();

  // Set the ref in the store once it's created
  useEffect(() => {
    if (internalVideoRef.current) {
      dispatch({ type: 'SET_VIDEO_REF', payload: internalVideoRef });
    }
  }, [dispatch]);

  useEffect(() => {
    showControls();
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      dispatch({ type: 'SET_DIMENSIONS', payload: { width: window.width, height: window.height } });
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const {
    onLoad: userOnLoad,
    onProgress: userOnProgress,
    onBuffer: userOnBuffer,
    onError: userOnError,
    onEnd: userOnEnd,
    onLayout: userOnLayout,
    ...nativeProps
  } = rest as Partial<ReactVideoProps>;

  const handleLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setBuffering(false);
    getAudioTracks(dedupeTracks(data.audioTracks, ['language', 'title', 'type']));
    getTextTracks(dedupeTracks(data.textTracks, ['language', 'title', 'type']));
    getVideoTracks(dedupeTracks(data.videoTracks, ['width', 'height', 'bitrate', 'codecs']));
  };
  const handleProgress = (data: any) => {
    setCurrentTime(data.currentTime);
  };
  const handleBuffer = (data: any) => setBuffering(data.isBuffering);
  const handleError = (error: any) =>
    dispatch({ type: 'SET_ERROR', payload: error?.error?.errorString || 'An unknown error occurred' });
  const handleEnd = () => {
    setPlaying(false);
    seek(0);
    showControls();
  };
  const handleLayout = (event: any) => {
    const { layout } = event.nativeEvent;
    dispatch({ type: 'SET_VIDEO_LAYOUT', payload: layout });
  };
  const isFullscreen = state.fullscreen;
  const videoStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      width: isFullscreen ? state.dimensions.width : '100%',
      height: isFullscreen ? state.dimensions.height : undefined,
      aspectRatio: isFullscreen ? undefined : 16 / 9,
      backgroundColor: 'black',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
    }),
    [isFullscreen, state.dimensions]
  );

  return (
    <View style={{ height: state.videoLayout.height, ...(Platform.OS === 'web' && { height: '100%' }) }}>
      <RNVideo
        ref={internalVideoRef}
        source={source}
        style={[videoStyle, style]}
        resizeMode={ResizeMode.CONTAIN}
        paused={!isPlaying}
        volume={muted ? 0 : volume}
        rate={playbackRate}
        selectedVideoTrack={{ type: SelectedVideoTrackType.RESOLUTION, value: videoTrack?.height }}
        selectedAudioTrack={{ type: SelectedTrackType.LANGUAGE, value: audioTrack?.language }}
        selectedTextTrack={{ type: SelectedTrackType.INDEX, value: textTrack?.index }}
        onLoad={combineHandlers(handleLoad, userOnLoad)}
        onProgress={combineHandlers(handleProgress, userOnProgress)}
        onBuffer={combineHandlers(handleBuffer, userOnBuffer)}
        onError={combineHandlers(handleError, userOnError)}
        onEnd={combineHandlers(handleEnd, userOnEnd)}
        progressUpdateInterval={500}
        onLayout={handleLayout}
        viewType={ViewType.TEXTURE}
        {...nativeProps}
      />
    </View>
  );
};
