import type { TextTrack } from 'react-native-video';

/** The parts of an audio or text track that say what language it's in. @internal */
export interface LanguageTrack {
  language?: string;
  title?: string;
  /** The player's own pick, such as an HLS rendition marked `DEFAULT=YES`. */
  selected?: boolean;
}

/**
 * A subtitle track in the toolkit's list (`useSettings().textTracks`). Tracks the toolkit draws
 * itself say where they come from.
 */
export interface CaptionTrack extends TextTrack {
  /**
   * `'file'`: a subtitle file from `source.textTracks`. `'hls'`: a subtitle rendition of an HLS
   * stream. `'native'` (or unset): a track the player draws, such as one embedded in an MP4.
   */
  source?: 'native' | 'file' | 'hls';
  /** The subtitle file or HLS playlist. */
  uri?: string | number;
}
