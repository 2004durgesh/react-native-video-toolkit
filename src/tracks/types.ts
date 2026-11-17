/** The parts of an audio or text track that say what language it's in. @internal */
export interface LanguageTrack {
  language?: string;
  title?: string;
  /** The player's own pick, such as an HLS rendition marked `DEFAULT=YES`. */
  selected?: boolean;
}
