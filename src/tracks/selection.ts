import type { TextTrack } from 'react-native-video';
import { DEVICE_LANGUAGE, isInLanguage, languageCode } from './language';
import type { LanguageTrack } from './types';

/**
 * The "Off" entry of the subtitle list. Its index, -1, sorts it before every real track, and never
 * goes to the player: subtitles off is `SelectedTrackType.DISABLED`.
 */
export const OFF_TEXT_TRACK = { index: -1, title: 'Off', language: 'off', type: 'disabled' } as TextTrack;

/** Whether a subtitle selection means subtitles off (no track, or the "Off" entry). */
export const isOffTrack = (track: { index?: number } | null | undefined): boolean => !track || track.index === -1;

/** Whether two audio or text tracks are in the same language, by code, or by title when unset. */
export const isSameLanguage = (a: LanguageTrack, b: LanguageTrack): boolean => {
  const language = languageCode(a.language);
  return language ? language === languageCode(b.language) : !!a.title && a.title === b.title;
};

/**
 * Whether `track` is the selected video track within one list. The player's own tracks compare by
 * index; custom tracks usually have no index, which would make every row look selected, so they
 * compare by height.
 */
export const isSelectedVideoTrack = (
  selected: { index?: number; height?: number } | null,
  track: { index?: number; height?: number }
): boolean => {
  if (!selected) return false;
  if (selected.index !== undefined && track.index !== undefined) return selected.index === track.index;
  return selected.height === track.height;
};

const pickTrack = <T>(tracks: T[], tests: ((track: T) => boolean)[]): T | null => {
  for (const test of tests) {
    const match = tracks.find(test);
    if (match) return match;
  }
  return tracks[0] ?? null;
};

const playerPick = (track: LanguageTrack) => !!track.selected;

/**
 * The subtitle track to show for a newly listed source. The viewer's choice carries over by
 * language, as the next episode keeps its subtitle language, and subtitles they turned off stay
 * off. Without a choice: the device's language, then the player's pick, then English, then the first.
 */
export const pickTextTrack = <T extends LanguageTrack>(
  tracks: T[],
  previous: T | null,
  device: string = DEVICE_LANGUAGE
): T | null => {
  if (previous && isOffTrack(previous as { index?: number })) return OFF_TEXT_TRACK as unknown as T;
  const inDevice = (track: T) => isInLanguage(track, device);
  const inEnglish = (track: T) => isInLanguage(track, 'en');
  return pickTrack(
    tracks,
    previous ? [(track) => isSameLanguage(track, previous), inDevice, inEnglish] : [inDevice, playerPick, inEnglish]
  );
};

/**
 * The audio track for a newly listed source. Without an earlier track: the player's pick (often the
 * original language), then the device's language. With one: its language, then the device's.
 * Otherwise the first track. The player's `selected` isn't trusted after an earlier choice, since it
 * can still reflect the previous source's index.
 */
export const pickAudioTrack = <T extends LanguageTrack>(
  tracks: T[],
  previous: LanguageTrack | null,
  device: string = DEVICE_LANGUAGE
): T | null => {
  const inDevice = (track: T) => isInLanguage(track, device);
  return pickTrack(tracks, previous ? [(track) => isSameLanguage(track, previous), inDevice] : [playerPick, inDevice]);
};

/**
 * The video track for a newly listed source. The player's own tracks stay adaptive ("Auto", `null`)
 * unless the viewer picked a height the new source also has: selecting a resolution pins it, so
 * starting on one would stop the quality adapting all session. A custom list is the app's own,
 * often with its own "Auto" entry, so it keeps the chosen height or starts at the video's.
 */
export const pickVideoTrack = <T extends { height?: number }>(
  tracks: T[],
  previous: { height?: number } | null,
  { custom, naturalHeight }: { custom: boolean; naturalHeight?: number }
): T | null => {
  const sameHeight = previous ? tracks.find((track) => track.height === previous.height) : undefined;
  if (!custom) return sameHeight ?? null;
  return sameHeight ?? tracks.find((track) => track.height === naturalHeight) ?? tracks[0] ?? null;
};
