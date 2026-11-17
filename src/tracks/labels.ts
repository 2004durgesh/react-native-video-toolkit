import type { CustomVideoTrack } from '../types';
import { languageDisplayName, namesNoLanguage } from './language';

// Titles react-native-video makes up for tracks without one
const PLACEHOLDER_TITLE = /^(Track|External) \d+$/;

/**
 * What to call an audio or text track in menus: its own title, else its language's name, else the language code,
 * else "Track n". react-native-video's "Track n" placeholders count as no title, so an MP4's tagged subtitle tracks
 * read "English" and "Arabic" rather than "Track 1" and "Track 2".
 */
export function trackLabel(track: { title?: string; language?: string; index?: number }): string {
  const title = track.title?.trim();
  if (title && !PLACEHOLDER_TITLE.test(title)) return title;
  const name = languageDisplayName(track.language);
  if (name) return name;
  const code = track.language?.trim();
  if (code && !namesNoLanguage(code)) return code;
  return title || `Track ${(track.index ?? 0) + 1}`;
}

/** What to call a video track in menus: its own label, else its height (`720p`). */
export function videoTrackLabel(track: CustomVideoTrack | { height?: number }): string {
  return ('label' in track && track.label) || `${track.height}p`;
}
