import { useEffect, useMemo, useRef } from 'react';
import { SelectedTrackType, TextTrackType, type ReactVideoProps, type TextTracks } from 'react-native-video';
import { useVideoSelector } from '../providers';
import { useSettings } from '../hooks/settings/useSettings';
import { dedupeLanguageTracks } from '../tracks/dedupe';
import { OFF_TEXT_TRACK, isOffTrack, pickTextTrack } from '../tracks/selection';
import { isDrawnByToolkit, useCaptionsController } from './CaptionsController';
import { isHlsUrl, loadHlsSubtitleRenditions } from './hls';
import type { CaptionTrack } from './types';

/**
 * Indexes for the subtitle tracks the toolkit draws, clear of the player's own: files from
 * `source.textTracks` from 1000, HLS subtitle renditions from 2000. They also set the list's order
 * (Off, the player's tracks, files, renditions) and appear in test IDs (`video-settings-captions-1000`).
 */
const FILE_TRACK_INDEX = 1000;
const HLS_TRACK_INDEX = 2000;

type Source = ReactVideoProps['source'];

/**
 * The subtitle side of a source, for `VideoSurface`. With the custom renderer, subtitle files and an
 * HLS stream's WebVTT renditions become the toolkit's tracks, listed next to the player's own and
 * drawn by the captions controller, and the player never gets them. Given them, iOS rebuilds an
 * MP4's playback without its extra tracks or AirPlay, and Android doesn't show them.
 * @internal
 */
export const useCaptionTracks = (source: Source, legacyTextTracks: TextTracks | undefined) => {
  const customCaptions = useVideoSelector((state) => state.config.captionRenderer) !== 'native';
  const captions = useCaptionsController();
  const { textTrack, setAvailableTextTracks, setTextTrack } = useSettings();

  const sourceObject = source && typeof source === 'object' ? source : undefined;
  const sidecars = sourceObject?.textTracks ?? legacyTextTracks;
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
  const videoSource = useMemo(() => {
    if (!customCaptions || !sourceObject?.textTracks) return source;
    const { textTracks: _drawnByToolkit, ...withoutSubtitles } = sourceObject;
    return withoutSubtitles;
  }, [customCaptions, source, sourceObject]);

  // The tracks known so far for this source arrive at different times (files at once, renditions
  // after a lookup, the player's when it loads), and each arrival relists them all
  const nativeTracks = useRef<CaptionTrack[]>([]);
  const hlsTracks = useRef<CaptionTrack[]>([]);
  const selection = useRef(textTrack as CaptionTrack | null);
  const headers = useRef(sourceObject?.headers);
  useEffect(() => {
    selection.current = textTrack as CaptionTrack | null;
    headers.current = sourceObject?.headers;
  });

  const list = () => {
    // An HLS stream's WebVTT renditions replace the player's own list, which repeats them. Closed
    // captions (CEA-608/708) the player lists go with it, so they're offered only without renditions.
    const known = customCaptions
      ? [...fileTracks, ...(hlsTracks.current.length > 0 ? hlsTracks.current : nativeTracks.current)]
      : nativeTracks.current;
    setAvailableTextTracks([...known, OFF_TEXT_TRACK].sort((a, b) => a.index - b.index));
    const next = pickTextTrack(known, selection.current);
    // Seen by another listing before the next render
    selection.current = next;
    setTextTrack(next);
  };
  const listRef = useRef(list);
  useEffect(() => {
    listRef.current = list;
  });

  // A new source: its subtitle files are listed at once, so their cues load alongside the video, and
  // an HLS stream's renditions are looked up in its master playlist. An effect rather than
  // `onLoadStart`, which the web player never sends.
  const sourceUri = typeof sourceObject?.uri === 'string' ? sourceObject.uri : undefined;
  const isHls = sourceUri !== undefined && (isHlsUrl(sourceUri) || sourceObject?.type === 'm3u8');
  const sidecarKey = fileTracks.map((track) => `${track.language}|${String(track.uri)}`).join(',');
  useEffect(() => {
    hlsTracks.current = [];
    if (sidecarKey) listRef.current();
    if (!customCaptions || !isHls || !sourceUri) return;
    const lookup = new AbortController();
    loadHlsSubtitleRenditions(sourceUri, { headers: headers.current, signal: lookup.signal })
      .then((renditions) => {
        if (lookup.signal.aborted || renditions.length === 0) return;
        hlsTracks.current = renditions.map((rendition, i) => ({
          index: HLS_TRACK_INDEX + i,
          title: rendition.name,
          language: rendition.language,
          type: TextTrackType.VTT,
          selected: rendition.default,
          source: 'hls',
          uri: rendition.uri,
        }));
        listRef.current();
      })
      .catch((error) => {
        if (!lookup.signal.aborted) captions.report(error, sourceUri);
      });
    return () => lookup.abort();
  }, [captions, customCaptions, isHls, sourceUri, sidecarKey]);

  // The selected track goes to the controller when the toolkit draws it. Until the new source's
  // tracks are listed, the selection can still be the previous source's track: it isn't shown.
  useEffect(() => {
    const track = textTrack as CaptionTrack | null;
    const listed = track?.source === 'hls' ? hlsTracks.current : fileTracks;
    const current = customCaptions && listed.some((known) => known.uri === track?.uri) ? track : null;
    captions.select(current, headers.current);
  }, [captions, customCaptions, textTrack, fileTracks]);

  return {
    videoSource,
    /** The subtitle files for the player itself, with the native renderer. */
    playerTextTracks: customCaptions ? undefined : legacyTextTracks,
    /**
     * Explicit `DISABLED` for Off and for the tracks the toolkit draws: left out, iOS picks a track
     * itself. Not index -1 either: react-native-video's iOS code reads `options[-1]` and crashes.
     */
    selectedTextTrack:
      textTrack && !isOffTrack(textTrack) && !isDrawnByToolkit(textTrack as CaptionTrack)
        ? { type: SelectedTrackType.INDEX, value: textTrack.index }
        : { type: SelectedTrackType.DISABLED },
    /**
     * A new source is starting: the previous one's player tracks no longer apply. With nothing known
     * yet, the selection stays until the new tracks are listed, so it can keep the viewer's language.
     */
    startSource: () => {
      nativeTracks.current = [];
      if (fileTracks.length > 0 || hlsTracks.current.length > 0) list();
      else setAvailableTextTracks([]);
    },
    /** The player has loaded and listed its own text tracks. */
    onPlayerTracks: (tracks: CaptionTrack[] | undefined) => {
      nativeTracks.current = dedupeLanguageTracks(tracks).map((track) => ({ ...track, source: 'native' }));
      list();
    },
  };
};
