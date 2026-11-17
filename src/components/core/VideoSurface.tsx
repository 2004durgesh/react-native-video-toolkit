import RNVideo, {
  ResizeMode,
  SelectedTrackType,
  SelectedVideoTrackType,
  TextTrackType,
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
import { useCallback, useEffect, useMemo, useRef, type FC } from 'react';
import { Platform, View, type LayoutRectangle, type StyleProp, type ViewStyle } from 'react-native';
import { useVideoSelector } from '../../providers';
import { useVideoStore } from '../../providers/VideoProvider';
import { useControlsController } from '../../providers/ControlsController';
import { useProgressStore } from '../../providers/ProgressStore';
import { usePlayback, useVolume, useBuffering, useSettings, usePlaybackRate } from '../../hooks';
import { combineHandlers } from '../../utils/common';
import { getFullscreenHeight } from '../../fullscreen/height';
import { dedupeLanguageTracks, dedupeVideoTracks } from '../../tracks/dedupe';
import { OFF_TEXT_TRACK, isOffTrack, pickAudioTrack, pickTextTrack, pickVideoTrack } from '../../tracks/selection';
import type { CustomVideoTrack } from '../../types';
import { useTestID } from '../../utils/testIDs';
import { usePlayerCommands } from '../../providers/PlayerCommands';
import { useCaptionsController } from '../../captions/CaptionsController';
import { isHlsUrl, loadHlsSubtitleRenditions } from '../../captions/hls';
import { captionError, isCaptionError } from '../../captions/errors';
import type { CaptionFormat, CaptionTrack } from '../../captions/types';

/**
 * Indexes for the subtitle tracks the toolkit draws, clear of the player's own track indexes: files
 * from `source.textTracks` from 1000, HLS subtitle renditions from 2000.
 */
const FILE_TRACK_INDEX = 1000;
const HLS_TRACK_INDEX = 2000;

/** A subtitle file's format, from its `textTracks` type. */
const formatOf = (type?: string): CaptionFormat | undefined =>
  type === TextTrackType.SUBRIP ? 'srt' : type === TextTrackType.VTT ? 'vtt' : undefined;

/** Whether the toolkit draws a track: a subtitle file or an HLS subtitle rendition. */
const isDrawnByToolkit = (track: CaptionTrack) => track.source === 'file' || track.source === 'hls';

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
  const store = useVideoStore();
  const { dispatch } = store;
  const captionRenderer = useVideoSelector((state) => state.config.captionRenderer);
  const enableScreenRotation = useVideoSelector((state) => state.config.enableScreenRotation);
  const progressUpdateInterval = useVideoSelector((state) => state.config.progressUpdateInterval);
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
  const { playbackRate } = usePlaybackRate();
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
  // The toolkit draws subtitle files and HLS subtitles itself, unless the app asks for the player's
  const customCaptions = captionRenderer !== 'native';
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

  const sourceObject = source && typeof source === 'object' ? source : undefined;
  const sidecars = sourceObject?.textTracks ?? legacyTextTracks;
  // Subtitle files become the toolkit's tracks...
  const fileTracks = useMemo<CaptionTrack[]>(
    () =>
      customCaptions && sidecars
        ? sidecars.map((track, i) => ({
            index: FILE_TRACK_INDEX + i,
            title: track.title,
            language: track.language,
            type: track.type,
            source: 'file',
            uri: track.uri,
          }))
        : [],
    [customCaptions, sidecars]
  );
  // ...and the player doesn't get them. Given them, iOS rebuilds an MP4's playback without its
  // extra tracks or AirPlay, and Android doesn't show them.
  const videoSource = useMemo(() => {
    if (!customCaptions || !source || typeof source !== 'object' || !source.textTracks) return source;
    const { textTracks: _drawnByToolkit, ...withoutSubtitles } = source;
    return withoutSubtitles;
  }, [customCaptions, source]);

  // The text tracks known so far for this source: the player's, and an HLS stream's renditions.
  // In refs, as they arrive at different times and each arrival relists the tracks.
  const nativeTextTracksRef = useRef<CaptionTrack[]>([]);
  const hlsTextTracksRef = useRef<CaptionTrack[]>([]);
  const textTrackRef = useRef(textTrack);
  const sourceHeadersRef = useRef(sourceObject?.headers);
  useEffect(() => {
    textTrackRef.current = textTrack;
    sourceHeadersRef.current = sourceObject?.headers;
  });

  /**
   * Lists the text tracks, with "Off" first, and picks one (see `pickTextTrack`). Indexes are never
   * reused across sources: the same index can be another language, or missing, in the new source.
   */
  const applyTextTracks = () => {
    const hlsTracks = hlsTextTracksRef.current;
    const list = customCaptions
      ? [...fileTracks, ...(hlsTracks.length > 0 ? hlsTracks : nativeTextTracksRef.current)]
      : nativeTextTracksRef.current;
    setAvailableTextTracks([...list, OFF_TEXT_TRACK].sort((a, b) => a.index - b.index));
    const next = pickTextTrack(list, textTrackRef.current as CaptionTrack | null);
    // Seen by another listing before the next render
    textTrackRef.current = next;
    setTextTrack(next);
  };
  // The latest, for the effect below, which runs only when the source changes
  const applyTextTracksRef = useRef(applyTextTracks);
  useEffect(() => {
    applyTextTracksRef.current = applyTextTracks;
  });

  // When the source changes: its subtitle files are listed at once, so their cues load alongside
  // the video, and an HLS stream's subtitle renditions are looked up in its master playlist. Until
  // (or unless) they're found, the player's own text tracks stay in the list. An effect rather than
  // `onLoadStart`, which the web player never sends.
  const sourceUri = typeof sourceObject?.uri === 'string' ? sourceObject.uri : undefined;
  // Tells videos apart, bundled ones (a number) included
  const sourceId = sourceObject ? String(sourceObject.uri ?? '') : String(source ?? '');
  const isHlsSource = sourceUri !== undefined && (isHlsUrl(sourceUri) || sourceObject?.type === 'm3u8');
  const sidecarKey = fileTracks.map((track) => `${track.language}|${String(track.uri)}`).join(',');
  useEffect(() => {
    hlsTextTracksRef.current = [];
    if (sidecarKey) applyTextTracksRef.current();
    if (!customCaptions || !isHlsSource || !sourceUri) return;
    const lookup = new AbortController();
    loadHlsSubtitleRenditions(sourceUri, { headers: sourceHeadersRef.current, signal: lookup.signal })
      .then((renditions) => {
        if (lookup.signal.aborted || renditions.length === 0) return;
        hlsTextTracksRef.current = renditions.map((rendition, i) => ({
          index: HLS_TRACK_INDEX + i,
          title: rendition.name,
          language: rendition.language,
          type: TextTrackType.VTT,
          selected: rendition.default,
          source: 'hls',
          uri: rendition.uri,
        }));
        applyTextTracksRef.current();
      })
      .catch((error) => {
        if (!lookup.signal.aborted && isCaptionError(error)) captions.report(error);
      });
    return () => lookup.abort();
  }, [captions, customCaptions, isHlsSource, sourceUri, sidecarKey]);

  // A new video starts from 0, and subtitles wait for it to play. Done here as well as in
  // `onLoadStart`, which the web player never sends.
  useEffect(() => {
    progressStore.update({ currentTime: 0, playableDuration: 0 });
    captions.reset();
  }, [captions, progressStore, sourceId]);

  const handleLoadStart = () => {
    dispatch({ type: 'SET_ENDED', payload: false });
    dispatch({ type: 'SET_DURATION', payload: 0 });
    dispatch({ type: 'SET_ERROR', payload: null });
    progressStore.update({ currentTime: 0, playableDuration: 0 });
    captions.reset();
    // The previous source's tracks don't apply; `handleLoad` lists the new ones. The selections stay
    // until then, so it can keep the viewer's languages.
    setAvailableAudioTracks([]);
    setAvailableVideoTracks([]);
    setAvailableTextTracks([]);
    dispatch({ type: 'SET_NATURAL_SIZE', payload: { width: 0, height: 0 } });
    nativeTextTracksRef.current = [];
    // The tracks known before the video loads (subtitle files, HLS renditions) stay listed
    if (fileTracks.length > 0 || hlsTextTracksRef.current.length > 0) applyTextTracks();
  };
  const handleLoad = (data: OnLoadData) => {
    dispatch({ type: 'SET_DURATION', payload: data.duration });
    setBuffering(false);
    // Playing state outlives a source: the previous one ending pauses it, so a new source would start paused
    dispatch({ type: 'SET_ENDED', payload: false });
    const config = store.getState().config;
    if (config.autoPlay) setPlaying(true);

    const customVideo = !!(config.useCustomVideoTracks && customVideoTracks);
    const audioTracksToUse =
      config.useCustomAudioTracks && customAudioTracks ? customAudioTracks : dedupeLanguageTracks(data.audioTracks);
    const videoTracksToUse: (CustomVideoTrack | VideoTrack)[] =
      customVideo && customVideoTracks ? customVideoTracks : dedupeVideoTracks(data.videoTracks);

    // The size the picture is drawn at, for placing subtitles on it. A portrait video can report its
    // stored, unrotated size.
    const { width = 0, height = 0, orientation } = data.naturalSize ?? {};
    dispatch({
      type: 'SET_NATURAL_SIZE',
      payload: orientation === 'portrait' && width > height ? { width: height, height: width } : { width, height },
    });

    setAvailableAudioTracks(audioTracksToUse);
    setAvailableVideoTracks(videoTracksToUse);

    // The player's own text tracks (embedded ones, or every one with the native renderer)
    nativeTextTracksRef.current = dedupeLanguageTracks(data.textTracks).map((track) => ({
      ...track,
      source: 'native',
    }));
    applyTextTracks();

    setAudioTrack(pickAudioTrack(audioTracksToUse, audioTrack));
    setVideoTrack(
      pickVideoTrack(videoTracksToUse, videoTrack, {
        custom: customVideo,
        naturalHeight: data.naturalSize.height,
      })
    );
  };
  const handleProgress = (data: OnProgressData) => {
    progressStore.update({ currentTime: data.currentTime, playableDuration: data.playableDuration });
  };
  const handleBuffer = (data: OnBufferData) => setBuffering(data.isBuffering);
  const handleError = (error: OnVideoErrorData) => {
    dispatch({ type: 'SET_ERROR', payload: error?.error?.errorString || 'An unknown error occurred' });
    // Android reports buffering before the error and never that it stopped, so the spinner would stay
    setBuffering(false);
  };
  const handleEnd = () => {
    // With `repeat`, the player loops by itself but still reports each pass as an end
    if (nativeProps.repeat) return;
    setPlaying(false);
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
  // The selected track, to the captions controller when the toolkit draws it. Until the new video's
  // tracks are listed, the selection can be the previous video's track: it isn't shown.
  useEffect(() => {
    const track = textTrack as CaptionTrack | null;
    const isListed = (tracks: CaptionTrack[]) => tracks.some((listed) => listed.uri === track?.uri);
    if (
      !customCaptions ||
      !track ||
      !isDrawnByToolkit(track) ||
      track.uri === undefined ||
      !isListed(track.source === 'hls' ? hlsTextTracksRef.current : fileTracks)
    ) {
      captions.select(null);
    } else if (track.source === 'hls') {
      captions.select({ kind: 'hls', playlistUrl: String(track.uri), headers: sourceHeadersRef.current });
    } else if (track.type === TextTrackType.TTML) {
      captions.select(null);
      captions.report(
        captionError('UNSUPPORTED_FORMAT', String(track.uri), "TTML subtitles need captionRenderer: 'native'")
      );
    } else {
      captions.select({ kind: 'file', uri: track.uri, format: formatOf(track.type as string | undefined) });
    }
  }, [captions, customCaptions, textTrack, fileTracks, sourceId]);

  const surfaceTestID = useTestID('surface', nativeProps.testID);
  const videoStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      // width: isFullscreen ? state.videoLayout.width : state.dimensions.width,
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
        source={videoSource}
        style={[videoStyle, style]}
        resizeMode={ResizeMode.CONTAIN}
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
        // Explicit `DISABLED` for "Off" and for the tracks the toolkit draws: left out, iOS picks a
        // track itself. Not index -1 either: react-native-video's iOS code reads `options[-1]` and crashes.
        selectedTextTrack={
          textTrack && !isOffTrack(textTrack) && !isDrawnByToolkit(textTrack as CaptionTrack)
            ? { type: SelectedTrackType.INDEX, value: textTrack.index }
            : { type: SelectedTrackType.DISABLED }
        }
        ignoreSilentSwitch="ignore"
        onLoadStart={combineHandlers(handleLoadStart, userOnLoadStart)}
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
        textTracks={customCaptions ? undefined : legacyTextTracks}
        {...nativeProps}
        // The wrapper has the ID, so a test finds the surface once
        testID={undefined}
      />
    </View>
  );
};
