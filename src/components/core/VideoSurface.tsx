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
  type OnPictureInPictureStatusChangedData,
  type ReactVideoProps,
  type AudioTrack,
  type VideoRef,
} from 'react-native-video';
import { useCallback, useEffect, useMemo, type FC } from 'react';
import { Dimensions, Platform, View, type LayoutRectangle, type StyleProp, type ViewStyle } from 'react-native';
import { useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';
import { useControlsController } from '../../providers/ControlsController';
import { useProgressStore } from '../../providers/ProgressStore';
import { usePlayback, useVolume, useBuffering, useSettings, usePlaybackRate } from '../../hooks';
import { combineHandlers, dedupeLanguageTracks, dedupeVideoTracks, getFullscreenHeight } from '../../utils';
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
  const { dispatch } = useVideoStore();
  const config = useVideoSelector((state) => state.config);
  const isFullscreen = useVideoSelector((state) => state.fullscreen);
  const dimensions = useVideoSelector((state) => state.dimensions);
  const videoLayoutHeight = useVideoSelector((state) => state.videoLayout.height);
  const { isPlaying, setPlaying } = usePlayback();
  const { muted, volume } = useVolume();
  // Writes the position straight to the store: subscribing through `useProgress()` would
  // re-render the video on every progress event
  const progressStore = useProgressStore();
  const { setBuffering } = useBuffering();
  // The controller directly: `useControlsVisibility()` would re-render the video on every toggle
  const { show: showControls } = useControlsController();
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

  // Attaches the player to the provider's ref. A player mounting under an existing provider (one at
  // the app root, say) also starts with its controls up; the provider restarts them when playback
  // starts or stops. A callback ref does both at mount without an effect.
  const videoRef = useVideoSelector((state) => state.videoRef);
  const attachVideo = useCallback(
    (instance: VideoRef | null) => {
      if (videoRef) videoRef.current = instance;
      if (instance) showControls();
    },
    [videoRef, showControls]
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      dispatch({ type: 'SET_DIMENSIONS', payload: { width: window.width, height: window.height } });
    });
    return () => subscription.remove();
  }, [dispatch]);

  const {
    onLoadStart: userOnLoadStart,
    onLoad: userOnLoad,
    onProgress: userOnProgress,
    onBuffer: userOnBuffer,
    onError: userOnError,
    onEnd: userOnEnd,
    onLayout: userOnLayout,
    onPlaybackRateChange: userOnPlaybackRateChange,
    onPictureInPictureStatusChanged: userOnPictureInPictureStatusChanged,
    onRestoreUserInterfaceForPictureInPictureStop: userOnRestoreUserInterfaceForPictureInPictureStop,
    ...nativeProps
  } = rest as Partial<ReactVideoProps>;

  const handleLoadStart = () => {
    dispatch({ type: 'SET_ENDED', payload: false });
    dispatch({ type: 'SET_DURATION', payload: 0 });
    progressStore.update({ currentTime: 0, playableDuration: 0 });
  };
  const handleLoad = (data: OnLoadData) => {
    dispatch({ type: 'SET_DURATION', payload: data.duration });
    setBuffering(false);
    // Playing state outlives a source: the previous one ending pauses it, so a new source would start paused
    dispatch({ type: 'SET_ENDED', payload: false });
    if (config.autoPlay) setPlaying(true);

    // Use custom tracks if configured, otherwise extract from video source
    const useCustomAudio = config.useCustomAudioTracks;
    const useCustomVideo = config.useCustomVideoTracks;

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
    progressStore.update({ currentTime: data.currentTime, playableDuration: data.playableDuration });
  };
  const handleBuffer = (data: OnBufferData) => setBuffering(data.isBuffering);
  const handleError = (error: OnVideoErrorData) =>
    dispatch({ type: 'SET_ERROR', payload: error?.error?.errorString || 'An unknown error occurred' });
  const handleEnd = () => {
    setPlaying(false);
    dispatch({ type: 'SET_ENDED', payload: true });
    videoRef?.current?.seek(0);
    progressStore.update({ currentTime: 0 });
    showControls();
  };
  const handleLayout = (event: { nativeEvent: { layout: LayoutRectangle } }) => {
    const { layout } = event.nativeEvent;
    dispatch({ type: 'SET_VIDEO_LAYOUT', payload: layout });
  };
  const handlePlaybackRateChange = (data: OnPlaybackRateChangeData) => {
    // A paused player reports a rate of 0. Keeping it would show "0x" and pass `rate={0}` back,
    // which keeps the video still after it resumes; pausing is `isPlaying`'s job, not the rate's.
    if (data.playbackRate > 0) setPlaybackRate(data.playbackRate);
  };
  const handlePictureInPictureStatusChanged = ({ isActive }: OnPictureInPictureStatusChangedData) => {
    dispatch({ type: 'SET_PICTURE_IN_PICTURE', payload: isActive });
    if (isActive) {
      config.onEnterPictureInPicture?.();
    } else {
      config.onExitPictureInPicture?.();
    }
  };
  // iOS asks the app to restore its player UI when the user leaves picture-in-picture, and waits for
  // an answer. The player stays mounted, so report it restored right away, unless the app handles it.
  const handleRestoreUserInterfaceForPictureInPictureStop =
    userOnRestoreUserInterfaceForPictureInPictureStop ??
    (() => videoRef?.current?.restoreUserInterfaceForPictureInPictureStopCompleted(true));
  const selectedAudioTrackConfig =
    typeof audioTrack?.index === 'number' ? { type: SelectedTrackType.INDEX, value: audioTrack.index } : undefined;
  const videoStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      // width: isFullscreen ? state.videoLayout.width : state.dimensions.width,
      height: isFullscreen ? getFullscreenHeight(dimensions, config.enableScreenRotation) : undefined,
      aspectRatio: isFullscreen ? undefined : 16 / 9,
      backgroundColor: 'black',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
    }),
    [isFullscreen, dimensions, config.enableScreenRotation]
  );

  return (
    <View
      onLayout={combineHandlers((e) => {
        const { layout } = e.nativeEvent;
        dispatch({ type: 'SET_VIDEO_WRAPPER_LAYOUT', payload: layout });
      }, userOnLayout)}
      style={{
        height: videoLayoutHeight || 'auto',
        ...(Platform.OS === 'web' && { height: '100vh' as unknown as number }),
      }}>
      <RNVideo
        ref={attachVideo}
        source={source}
        style={[videoStyle, style]}
        resizeMode={ResizeMode.CONTAIN}
        paused={!isPlaying}
        volume={volume}
        muted={muted}
        rate={playbackRate}
        controls={false}
        selectedVideoTrack={{ type: SelectedVideoTrackType.RESOLUTION, value: videoTrack?.height }}
        selectedAudioTrack={selectedAudioTrackConfig}
        selectedTextTrack={{ type: SelectedTrackType.INDEX, value: textTrack?.index }}
        ignoreSilentSwitch="ignore"
        onLoadStart={combineHandlers(handleLoadStart, userOnLoadStart)}
        onLoad={combineHandlers(handleLoad, userOnLoad)}
        onProgress={combineHandlers(handleProgress, userOnProgress)}
        onBuffer={combineHandlers(handleBuffer, userOnBuffer)}
        onError={combineHandlers(handleError, userOnError)}
        onEnd={combineHandlers(handleEnd, userOnEnd)}
        onPlaybackRateChange={combineHandlers(handlePlaybackRateChange, userOnPlaybackRateChange)}
        onPictureInPictureStatusChanged={combineHandlers(
          handlePictureInPictureStatusChanged,
          userOnPictureInPictureStatusChanged
        )}
        onRestoreUserInterfaceForPictureInPictureStop={handleRestoreUserInterfaceForPictureInPictureStop}
        progressUpdateInterval={500}
        onLayout={handleLayout}
        viewType={ViewType.TEXTURE}
        subtitleStyle={{ paddingBottom: 50, fontSize: 20, opacity: 0.8 }}
        {...nativeProps}
      />
    </View>
  );
};
