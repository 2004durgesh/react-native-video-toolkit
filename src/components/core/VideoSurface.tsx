import {
  useVideoPlayer,
  VideoView,
  type AllPlayerEvents,
  type AudioTrack,
  type VideoConfig,
  type VideoPlayer,
  type VideoSource,
  type VideoTrack,
  type VideoViewProps,
  type WebVideoPlayer,
  type onLoadData,
  type onProgressData,
  type VideoRuntimeError,
} from 'react-native-video';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
export interface VideoSurfaceProps {
  /**
   * The video to play: a URL, a `require()`d asset, or a full react-native-video `VideoConfig`
   * (headers, DRM, `externalSubtitles`, buffer settings...).
   */
  source: VideoConfig | VideoSource;
  /**
   * Style for the video view.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Props passed to react-native-video's `VideoView` (everything except `player`).
   */
  viewProps?: Partial<Omit<VideoViewProps, 'player'>>;
  /**
   * Player event callbacks. They run after the toolkit's own handling of the same event.
   */
  events?: Partial<AllPlayerEvents>;
  /**
   * Called on layout of the wrapper view.
   */
  onLayout?: (event: LayoutChangeEvent) => void;
  /**
   * Custom audio tracks to use instead of the ones reported by the player.
   * Only used when config.useCustomAudioTracks is true.
   */
  customAudioTracks?: AudioTrack[];
  /**
   * Custom video tracks to use instead of the ones reported by the player.
   * Only used when config.useCustomVideoTracks is true.
   */
  customVideoTracks?: CustomVideoTrack[];
}

/**
 * Audio and quality track selection is only implemented by react-native-video v7's web player.
 * On iOS and Android these lists stay empty, so the settings menu hides those options.
 */
const asWebPlayer = (player: VideoPlayer): WebVideoPlayer | null => {
  const candidate = player as unknown as Partial<WebVideoPlayer>;
  return typeof candidate.getAvailableAudioTracks === 'function' &&
    typeof candidate.getAvailableVideoTracks === 'function'
    ? (player as unknown as WebVideoPlayer)
    : null;
};

/**
 * Picks the track to select after media loads: the current one if it still exists (by id),
 * otherwise the one the player marks as selected, otherwise the first; `null` if there are none.
 */
const pickTrack = <T extends { id?: string; selected?: boolean }>(current: T | null, tracks: T[]): T | null =>
  (current?.id !== undefined ? tracks.find((t) => t.id === current.id) : undefined) ??
  tracks.find((t) => t.selected) ??
  tracks[0] ??
  null;

/**
 * A component that wraps the `react-native-video` library
 * and provides a simple interface for playing videos.
 *
 * This component is responsible for handling video playback,
 * events, and other video-related functionality.
 */
const VideoSurfaceContent: FC<VideoSurfaceProps> = ({
  source,
  style,
  viewProps,
  events,
  onLayout: userOnLayout,
  customAudioTracks,
  customVideoTracks,
}) => {
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

  // The player is recreated by react-native-video whenever `source` changes.
  const player = useVideoPlayer(source, (p) => {
    // Play audio even when the iOS silent switch is on (iOS-only setting).
    if (Platform.OS === 'ios') {
      p.ignoreSilentSwitchMode = 'ignore';
    }
  });

  // Expose the player to the rest of the toolkit (seeking, gestures...).
  useEffect(() => {
    dispatch({ type: 'SET_PLAYER', payload: player });
    return () => dispatch({ type: 'SET_PLAYER', payload: null });
  }, [player, dispatch]);

  useEffect(() => {
    showControls();
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      dispatch({ type: 'SET_DIMENSIONS', payload: { width: window.width, height: window.height } });
    });
    return () => subscription.remove();
  }, [dispatch, showControls]);

  // Toolkit state is the source of truth; mirror it into the player.
  useEffect(() => {
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, isPlaying]);

  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (playbackRate > 0) {
      player.rate = playbackRate;
    }
  }, [player, playbackRate]);

  // Track selection throws until the native player has loaded its media, so selections are only
  // applied once this specific player instance has fired `onLoad`.
  const [loadedPlayer, setLoadedPlayer] = useState<VideoPlayer | null>(null);
  const isLoaded = loadedPlayer === player;

  useEffect(() => {
    if (!isLoaded) return;
    // `null` turns subtitles off.
    player.selectTextTrack(textTrack ?? null);
  }, [player, isLoaded, textTrack]);

  useEffect(() => {
    const webPlayer = asWebPlayer(player);
    if (!isLoaded || !webPlayer || !audioTrack) return;
    webPlayer.selectAudioTrack(audioTrack);
  }, [player, isLoaded, audioTrack]);

  useEffect(() => {
    const webPlayer = asWebPlayer(player);
    if (!isLoaded || !webPlayer || !videoTrack) return;
    webPlayer.selectVideoTrack(videoTrack as VideoTrack);
  }, [player, isLoaded, videoTrack]);

  const handleLoad = (data: onLoadData) => {
    setLoadedPlayer(player);
    setDuration(data.duration);
    setBuffering(false);

    // The play() issued before the media was ready may not stick on every platform.
    if (isPlaying) {
      player.play();
    }

    const webPlayer = asWebPlayer(player);

    const audioTracksToUse =
      state.config.useCustomAudioTracks && customAudioTracks
        ? customAudioTracks
        : dedupeLanguageTracks(webPlayer?.getAvailableAudioTracks());

    const videoTracksToUse =
      state.config.useCustomVideoTracks && customVideoTracks
        ? customVideoTracks
        : dedupeVideoTracks(webPlayer?.getAvailableVideoTracks());

    const textTracks = dedupeLanguageTracks(player.getAvailableTextTracks());

    // On native, audio/quality selection isn't supported, so don't offer it.
    setAvailableAudioTracks(webPlayer ? audioTracksToUse : []);
    setAvailableVideoTracks(webPlayer ? videoTracksToUse : []);
    setAvailableTextTracks(textTracks);

    // Keep the current selection if the new media has the same track (e.g. after switching
    // sources); otherwise use whatever the player reports as active, or the first track.
    if (webPlayer) {
      setAudioTrack(pickTrack(audioTrack, audioTracksToUse));
      setVideoTrack(pickTrack(videoTrack, videoTracksToUse));
    }
    setTextTrack(pickTrack(textTrack, textTracks));
  };
  const handleProgress = (data: onProgressData) => {
    setCurrentTime(data.currentTime);
    // `bufferDuration` is how far ahead of the playhead the player has buffered.
    setPlayableDuration(data.currentTime + data.bufferDuration);
  };
  const handleBuffer = (buffering: boolean) => setBuffering(buffering);
  const handleError = (error: VideoRuntimeError) =>
    dispatch({ type: 'SET_ERROR', payload: error?.message || 'An unknown error occurred' });
  const handleEnd = () => {
    setPlaying(false);
    seek(0);
    showControls();
  };
  const handlePlaybackRateChange = (rate: number) => {
    // Some platforms report a rate of 0 while paused; that isn't a speed the user chose.
    if (rate > 0) {
      setPlaybackRate(rate);
    }
  };

  // Keep the latest handlers in a ref so player listeners are only attached once per player.
  const handlersRef = useRef({
    handleLoad,
    handleProgress,
    handleBuffer,
    handleError,
    handleEnd,
    handlePlaybackRateChange,
    events,
  });
  handlersRef.current = {
    handleLoad,
    handleProgress,
    handleBuffer,
    handleError,
    handleEnd,
    handlePlaybackRateChange,
    events,
  };

  // Re-subscribe user events only when the set of event names changes, not on every render.
  const userEventNames = Object.keys(events ?? {})
    .sort()
    .join(',');

  useEffect(() => {
    const h = () => handlersRef.current;
    const subscriptions = [
      player.addEventListener('onLoad', (data) => {
        h().handleLoad(data);
        h().events?.onLoad?.(data);
      }),
      player.addEventListener('onProgress', (data) => {
        h().handleProgress(data);
        h().events?.onProgress?.(data);
      }),
      player.addEventListener('onBuffer', (buffering) => {
        h().handleBuffer(buffering);
        h().events?.onBuffer?.(buffering);
      }),
      player.addEventListener('onError', (error) => {
        h().handleError(error);
        h().events?.onError?.(error);
      }),
      player.addEventListener('onEnd', () => {
        h().handleEnd();
        h().events?.onEnd?.();
      }),
      player.addEventListener('onPlaybackRateChange', (rate) => {
        h().handlePlaybackRateChange(rate);
        h().events?.onPlaybackRateChange?.(rate);
      }),
    ];

    // Forward any other events the consumer asked for.
    const handledInternally = new Set(['onLoad', 'onProgress', 'onBuffer', 'onError', 'onEnd', 'onPlaybackRateChange']);
    for (const name of userEventNames ? userEventNames.split(',') : []) {
      if (handledInternally.has(name)) continue;
      const eventName = name as keyof AllPlayerEvents;
      subscriptions.push(
        player.addEventListener(eventName, ((...args: unknown[]) =>
          (h().events?.[eventName] as ((...a: unknown[]) => void) | undefined)?.(
            ...args
          )) as AllPlayerEvents[typeof eventName])
      );
    }

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [player, userEventNames]);

  const isFullscreen = state.fullscreen;
  const videoStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
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
      onLayout={combineHandlers((e: LayoutChangeEvent) => {
        const { layout } = e.nativeEvent;
        dispatch({ type: 'SET_VIDEO_WRAPPER_LAYOUT', payload: layout });
      }, userOnLayout)}
      style={{
        height: state.videoLayout.height || 'auto',
        ...(Platform.OS === 'web' && { height: '100vh' as unknown as number }),
      }}>
      <VideoView
        player={player}
        style={StyleSheet.flatten([videoStyle, style])}
        resizeMode="contain"
        controls={false}
        // TextureView keeps the video composable with the toolkit's overlays and animations on Android.
        surfaceType="texture"
        {...viewProps}
        onLayout={combineHandlers((e: LayoutChangeEvent) => {
          const { layout } = e.nativeEvent;
          dispatch({ type: 'SET_VIDEO_LAYOUT', payload: layout });
        }, viewProps?.onLayout)}
      />
    </View>
  );
};

/**
 * react-native-video v7 can't create a player during server-side rendering (e.g. Next.js), so on
 * web the player is only created once the component has mounted in the browser. Until then a
 * black placeholder keeps the layout stable. On native the player is created immediately.
 */
export const VideoSurface: FC<VideoSurfaceProps> = (props) => {
  const [isMounted, setIsMounted] = useState(Platform.OS !== 'web');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <View style={[styles.placeholder, props.style]} />;
  }

  return <VideoSurfaceContent {...props} />;
};

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
  },
});
