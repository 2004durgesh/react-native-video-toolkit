import RNVideo, {
  ResizeMode,
  SelectedTrackType,
  SelectedVideoTrackType,
  ViewType,
  type OnLoadData,
  type OnProgressData,
  type OnBufferData,
  type OnVideoErrorData,
  type OnPictureInPictureStatusChangedData,
  type ReactVideoProps,
  type AudioTrack,
  type VideoRef,
  type VideoTrack,
} from 'react-native-video';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type FC } from 'react';
import { Platform, View, type LayoutRectangle, type StyleProp, type ViewStyle } from 'react-native';
import { useSettingsContext, useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';
import { useControlsController } from '../../providers/ControlsController';
import { useProgressStore } from '../../providers/ProgressStore';
import { useVolume, useSettings, usePlaybackRate } from '../../hooks';
import { combineHandlers } from '../../utils/common';
import { getFullscreenHeight } from '../../fullscreen/height';
import { dedupeLanguageTracks, dedupeVideoTracks } from '../../tracks/dedupe';
import { pickAudioTrack, pickVideoTrack } from '../../tracks/selection';
import type { CustomVideoTrack } from '../../types';
import { useTestID } from '../../utils/testIDs';
import { usePlayerCommands } from '../../providers/PlayerCommands';
import { useCaptionsController } from '../../captions/CaptionsController';
import { useCaptionTracks } from '../../captions/useCaptionTracks';

/**
 * Props for the VideoSurface component.
 */
export interface VideoSurfaceProps extends ReactVideoProps {
  /**
   * Audio tracks to list instead of the source's own. Passing them turns custom audio tracks on.
   */
  customAudioTracks?: AudioTrack[];
  /**
   * Qualities to list instead of the source's own, with a `label` to show and an optional `uri`.
   * Passing them turns custom video tracks on.
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
  const store = useVideoStore();
  const { dispatch } = store;
  const enableScreenRotation = useVideoSelector((state) => state.config.enableScreenRotation);
  const progressUpdateInterval = useVideoSelector((state) => state.config.progressUpdateInterval);
  const isFullscreen = useVideoSelector((state) => state.fullscreen);
  const dimensions = useVideoSelector((state) => state.dimensions);
  const videoLayoutHeight = useVideoSelector((state) => state.videoLayout.height);
  const isPlaying = useVideoSelector((state) => state.isPlaying);
  const { muted, volume } = useVolume();
  // Writes the position straight to the store: subscribing through `useProgress()` would
  // re-render the video on every progress event
  const progressStore = useProgressStore();
  // The controller directly: `useControlsVisibility()` would re-render the video on every toggle
  const { show: showControls } = useControlsController();
  const { playbackRate } = usePlaybackRate();
  const { videoTrack, audioTrack, setAvailableAudioTracks, setAudioTrack, setVideoTrack } = useSettings();
  const { dispatch: settingsDispatch } = useSettingsContext();
  // The app's own lists, when it passes them, replace the source's tracks
  const customVideo = !!customVideoTracks;
  const listVideoTracks = (tracks: (CustomVideoTrack | VideoTrack)[]) =>
    settingsDispatch({ type: 'SET_AVAILABLE_VIDEO_TRACKS', payload: tracks, custom: customVideo });
  const captions = useCaptionsController();
  const commands = usePlayerCommands();

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
    // The deprecated top-level form of `source.textTracks`
    textTracks: legacyTextTracks,
    ...nativeProps
  } = rest as Partial<ReactVideoProps>;

  const textTracks = useCaptionTracks(source, legacyTextTracks);

  /**
   * Resets what belongs to the previous source, in one place: when the source changes (the web
   * player sends no `onLoadStart`) and on `onLoadStart`. Selections stay, so the next video keeps
   * the viewer's languages; `handleLoad` lists the new tracks.
   */
  const startSource = () => {
    dispatch({ type: 'SET_ENDED', payload: false });
    dispatch({ type: 'SET_DURATION', payload: 0 });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_NATURAL_SIZE', payload: { width: 0, height: 0 } });
    progressStore.update({ currentTime: 0, playableDuration: 0 });
    captions.reset();
    setAvailableAudioTracks([]);
    listVideoTracks([]);
    textTracks.startSource();
  };
  const startSourceRef = useRef(startSource);
  useEffect(() => {
    startSourceRef.current = startSource;
  });
  // Tells videos apart, bundled ones (a number) included
  const sourceObject = source && typeof source === 'object' ? source : undefined;
  const sourceId = sourceObject ? String(sourceObject.uri ?? '') : String(source ?? '');
  useEffect(() => startSourceRef.current(), [sourceId]);

  const handleLoad = (data: OnLoadData) => {
    dispatch({ type: 'SET_DURATION', payload: data.duration });
    dispatch({ type: 'SET_BUFFERING', payload: false });
    // Playing state outlives a source: the previous one ending pauses it, so a new source would start paused
    dispatch({ type: 'SET_ENDED', payload: false });
    if (store.getState().config.autoPlay) commands.setPlaying(true);

    const audioTracksToUse = customAudioTracks ?? dedupeLanguageTracks(data.audioTracks);
    const videoTracksToUse: (CustomVideoTrack | VideoTrack)[] =
      customVideoTracks ?? dedupeVideoTracks(data.videoTracks);

    // The size the picture is drawn at, for placing subtitles on it. A portrait video can report its
    // stored, unrotated size.
    const { width = 0, height = 0, orientation } = data.naturalSize ?? {};
    dispatch({
      type: 'SET_NATURAL_SIZE',
      payload: orientation === 'portrait' && width > height ? { width: height, height: width } : { width, height },
    });

    setAvailableAudioTracks(audioTracksToUse);
    listVideoTracks(videoTracksToUse);

    // The player's own text tracks (embedded ones, or every one with the native renderer)
    textTracks.onPlayerTracks(data.textTracks);

    setAudioTrack(pickAudioTrack(audioTracksToUse, audioTrack));
    setVideoTrack(
      pickVideoTrack(videoTracksToUse, videoTrack, {
        custom: customVideo,
        naturalHeight: data.naturalSize.height,
      })
    );
  };
  const handleProgress = (data: OnProgressData) => {
    progressStore.report({ currentTime: data.currentTime, playableDuration: data.playableDuration });
  };
  const handleBuffer = (data: OnBufferData) => dispatch({ type: 'SET_BUFFERING', payload: data.isBuffering });
  const handleError = (error: OnVideoErrorData) => {
    dispatch({ type: 'SET_ERROR', payload: error?.error?.errorString || 'An unknown error occurred' });
    // Android reports buffering before the error and never that it stopped, so the spinner would stay
    dispatch({ type: 'SET_BUFFERING', payload: false });
  };
  const handleEnd = () => {
    // With `repeat`, the player loops by itself but still reports each pass as an end
    if (nativeProps.repeat) return;
    commands.setPlaying(false);
    dispatch({ type: 'SET_ENDED', payload: true });
    commands.seek(0);
    showControls();
  };
  const handleLayout = (event: { nativeEvent: { layout: LayoutRectangle } }) => {
    const { layout } = event.nativeEvent;
    dispatch({ type: 'SET_VIDEO_LAYOUT', payload: layout });
  };
  const handlePictureInPictureStatusChanged = ({ isActive }: OnPictureInPictureStatusChangedData) => {
    dispatch({ type: 'SET_PICTURE_IN_PICTURE', payload: isActive });
    if (isActive) {
      store.getState().config.onEnterPictureInPicture?.();
    } else {
      store.getState().config.onExitPictureInPicture?.();
    }
  };
  // iOS asks the app to restore its player UI when the user leaves picture-in-picture, and waits for
  // an answer. The player stays mounted, so report it restored right away, unless the app handles it.
  const handleRestoreUserInterfaceForPictureInPictureStop =
    userOnRestoreUserInterfaceForPictureInPictureStop ??
    (() => videoRef?.current?.restoreUserInterfaceForPictureInPictureStopCompleted(true));
  const selectedAudioTrackConfig =
    typeof audioTrack?.index === 'number' ? { type: SelectedTrackType.INDEX, value: audioTrack.index } : undefined;
  // How the video fits its box, for placing subtitles on the picture
  const resizeMode = nativeProps.resizeMode ?? ResizeMode.CONTAIN;
  useLayoutEffect(() => {
    dispatch({ type: 'SET_RESIZE_MODE', payload: resizeMode });
  }, [dispatch, resizeMode]);

  const surfaceTestID = useTestID('surface', nativeProps.testID);
  const videoStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      height: isFullscreen ? getFullscreenHeight(dimensions, enableScreenRotation) : undefined,
      aspectRatio: isFullscreen ? undefined : 16 / 9,
      backgroundColor: 'black',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
    }),
    [isFullscreen, dimensions, enableScreenRotation]
  );

  return (
    <View
      onLayout={combineHandlers((e) => {
        const { layout } = e.nativeEvent;
        dispatch({ type: 'SET_VIDEO_WRAPPER_LAYOUT', payload: layout });
      }, userOnLayout)}
      // On the wrapper, as react-native-video's web player drops `testID`
      testID={surfaceTestID}
      style={{
        height: videoLayoutHeight || 'auto',
        ...(Platform.OS === 'web' && { height: '100vh' as unknown as number }),
      }}>
      <RNVideo
        ref={attachVideo}
        source={textTracks.videoSource}
        style={[videoStyle, style]}
        resizeMode={resizeMode}
        paused={!isPlaying}
        volume={volume}
        muted={muted}
        rate={playbackRate}
        controls={false}
        selectedVideoTrack={
          videoTrack
            ? { type: SelectedVideoTrackType.RESOLUTION, value: videoTrack.height }
            : { type: SelectedVideoTrackType.AUTO }
        }
        selectedAudioTrack={selectedAudioTrackConfig}
        selectedTextTrack={textTracks.selectedTextTrack}
        ignoreSilentSwitch="ignore"
        onLoadStart={combineHandlers(startSource, userOnLoadStart)}
        onLoad={combineHandlers(handleLoad, userOnLoad)}
        onProgress={combineHandlers(handleProgress, userOnProgress)}
        onBuffer={combineHandlers(handleBuffer, userOnBuffer)}
        onError={combineHandlers(handleError, userOnError)}
        onEnd={combineHandlers(handleEnd, userOnEnd)}
        // The rate isn't read back from the player: Android reports 1 or 0 for playing or paused
        // (not the speed), so it reset 1.5x to 1x on every resume, and the toolkit sets the rate anyway
        onPlaybackRateChange={userOnPlaybackRateChange}
        onPictureInPictureStatusChanged={combineHandlers(
          handlePictureInPictureStatusChanged,
          userOnPictureInPictureStatusChanged
        )}
        onRestoreUserInterfaceForPictureInPictureStop={handleRestoreUserInterfaceForPictureInPictureStop}
        progressUpdateInterval={progressUpdateInterval}
        onLayout={handleLayout}
        viewType={ViewType.TEXTURE}
        // ExoPlayer's own view took the D-pad's focus on Android TV, under the toolkit's controls,
        // and kept it: they're the ones to focus
        focusable={false}
        subtitleStyle={{ paddingBottom: 50, fontSize: 20, opacity: 0.8 }}
        // With the native renderer, subtitle files go to the player as before
        textTracks={textTracks.playerTextTracks}
        {...nativeProps}
        // The wrapper has the ID, so a test finds the surface once
        testID={undefined}
      />
    </View>
  );
};
