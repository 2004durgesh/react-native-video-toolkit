import RNVideo, {
  ResizeMode,
  SelectedTrackType,
  SelectedVideoTrackType,
  ViewType,
  type OnLoadData,
  type OnPlaybackRateChangeData,
  type OnProgressData,
  type OnBufferData,
  type OnVideoErrorData,
  type ReactVideoProps,
  type AudioTrack,
} from 'react-native-video';
import { useEffect, useMemo, useRef, type FC } from 'react';
import { Dimensions, Platform, View, type LayoutRectangle, type StyleProp, type ViewStyle } from 'react-native';
import { useVideo } from '../../providers';
import {
  usePlayback,
  useVolume,
  useProgress,
  useBuffering,
  useControlsVisibility,
  useSettings,
  usePlaybackRate,
} from '../../hooks';
import { combineHandlers, dedupeLanguageTracks, dedupeVideoTracks } from '../../utils';
import type { CustomVideoTrack } from '../../types';

/**
 * Props for the VideoSurface component.
 */
interface VideoSurfaceProps extends ReactVideoProps {
  /**
   * Custom audio tracks to use instead of auto-extracting from video source.
   * Only used when config.useCustomAudioTracks is true.
   */
  customAudioTracks?: AudioTrack[];
  /**
   * Custom video tracks to use instead of auto-extracting from video source.
   * Only used when config.useCustomVideoTracks is true.
   * Supports CustomVideoTrack with label and uri fields for better UX.
   */
  customVideoTracks?: CustomVideoTrack[];
}

/**
 * A component that wraps the `react-native-video` library
 * and provides a simple interface for playing videos.
 *
 * This component is responsible for handling video playback,
 * events, and other video-related functionality.
 */
export const VideoSurface: FC<VideoSurfaceProps> = ({
  source,
  style,
  customAudioTracks,
  customVideoTracks,
  ...rest
}) => {
  const internalVideoRef = useRef(null);
  const { dispatch, state } = useVideo();
  const { isPlaying, setPlaying } = usePlayback();
  const { muted, volume } = useVolume();
  const { setCurrentTime, setDuration, seek, setPlayableDuration } = useProgress();
  const { setBuffering } = useBuffering();
  const { showControls } = useControlsVisibility();
  const { playbackRate, setPlaybackRate } = usePlaybackRate();
  const {
    videoTrack,
    audioTrack,
    textTrack,
    setAvailableVideoTracks,
    setAvailableAudioTracks,
    setAvailableTextTracks,
    setAudioTrack,
    setTextTrack,
    setVideoTrack,
  } = useSettings();

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
    onPlaybackRateChange: userOnPlaybackRateChange,
    ...nativeProps
  } = rest as Partial<ReactVideoProps>;

  const handleLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setBuffering(false);

    // Use custom tracks if configured, otherwise extract from video source
    const useCustomAudio = state.config.useCustomAudioTracks;
    const useCustomVideo = state.config.useCustomVideoTracks;

    // Handle audio tracks
    let audioTracksToUse;
    if (useCustomAudio && customAudioTracks) {
      audioTracksToUse = customAudioTracks;
    } else {
      audioTracksToUse = dedupeLanguageTracks(data.audioTracks);
    }

    // Handle video tracks
    let videoTracksToUse;
    if (useCustomVideo && customVideoTracks) {
      videoTracksToUse = customVideoTracks;
    } else {
      videoTracksToUse = dedupeVideoTracks(data.videoTracks);
    }

    // Text tracks are always extracted from source (no custom option for now)
    const dedupedTextTracks = dedupeLanguageTracks(data.textTracks);

    // Set the tracks in state
    setAvailableAudioTracks(audioTracksToUse);
    setAvailableVideoTracks(videoTracksToUse);

    // Add an "Off" option for text tracks
    setAvailableTextTracks(
      [...dedupedTextTracks, { index: -1, title: 'Off', language: 'off', type: 'disabled' }].sort(
        (a, b) => a.index - b.index
      )
    );

    // Select the first track by default if none is selected
    if (!audioTrack && audioTracksToUse.length > 0) {
      setAudioTrack(audioTracksToUse[0]!);
    }
    // Select the first track by default if none is selected
    if (!textTrack && dedupedTextTracks.length > 0) {
      setTextTrack(dedupedTextTracks[0]!);
    }
    // Select the track that matches the natural size, or the first one if none match
    if (!videoTrack && videoTracksToUse.length > 0) {
      const naturalSizeIndex = videoTracksToUse.findIndex((t) => t.height === data.naturalSize.height);
      setVideoTrack(videoTracksToUse[naturalSizeIndex !== -1 ? naturalSizeIndex : 0]!);
    }
  };
  const handleProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
    setPlayableDuration(data.playableDuration);
  };
  const handleBuffer = (data: OnBufferData) => setBuffering(data.isBuffering);
  const handleError = (error: OnVideoErrorData) =>
    dispatch({ type: 'SET_ERROR', payload: error?.error?.errorString || 'An unknown error occurred' });
  const handleEnd = () => {
    setPlaying(false);
    seek(0);
    showControls();
  };
  const handleLayout = (event: { nativeEvent: { layout: LayoutRectangle } }) => {
    const { layout } = event.nativeEvent;
    dispatch({ type: 'SET_VIDEO_LAYOUT', payload: layout });
  };
  const handlePlaybackRateChange = (data: OnPlaybackRateChangeData) => {
    setPlaybackRate(data.playbackRate);
  };
  const isFullscreen = state.fullscreen;
  const videoStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      // width: isFullscreen ? state.videoLayout.width : state.dimensions.width,
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
    <View
      onLayout={combineHandlers((e) => {
        const { layout } = e.nativeEvent;
        dispatch({ type: 'SET_VIDEO_WRAPPER_LAYOUT', payload: layout });
      }, userOnLayout)}
      style={{
        height: state.videoLayout.height || 'auto',
        ...(Platform.OS === 'web' && { height: '100vh' as unknown as number }),
      }}>
      <RNVideo
        ref={internalVideoRef}
        source={source}
        style={[videoStyle, style]}
        resizeMode={ResizeMode.CONTAIN}
        paused={!isPlaying}
        volume={volume}
        muted={muted}
        rate={playbackRate}
        controls={false}
        selectedVideoTrack={{ type: SelectedVideoTrackType.RESOLUTION, value: videoTrack?.height }}
        selectedAudioTrack={{ type: SelectedTrackType.INDEX, value: audioTrack?.index }}
        selectedTextTrack={{ type: SelectedTrackType.INDEX, value: textTrack?.index }}
        onLoad={combineHandlers(handleLoad, userOnLoad)}
        onProgress={combineHandlers(handleProgress, userOnProgress)}
        onBuffer={combineHandlers(handleBuffer, userOnBuffer)}
        onError={combineHandlers(handleError, userOnError)}
        onEnd={combineHandlers(handleEnd, userOnEnd)}
        onPlaybackRateChange={combineHandlers(handlePlaybackRateChange, userOnPlaybackRateChange)}
        progressUpdateInterval={500}
        onLayout={handleLayout}
        viewType={ViewType.TEXTURE}
        subtitleStyle={{ paddingBottom: 50, fontSize: 20, opacity: 0.8 }}
        {...nativeProps}
      />
    </View>
  );
};
