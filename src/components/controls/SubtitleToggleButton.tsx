import { BaseIconButton } from '../common';
import { Subtitles, SubtitlesOff } from '../svgs';
import { useSettings } from '../../hooks';
import { useState } from 'react';
import type { TextTrack } from 'react-native-video';
import { useTestID } from '../../utils/testIDs';
import { OFF_TEXT_TRACK, isOffTrack, isSameLanguage } from '../../tracks/selection';

export interface SubtitleToggleButtonProps {
  /**
   * Identifies the button in end-to-end tests.
   * @default `video-subtitles-button`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

/**
 * A button that toggles subtitles on and off.
 *
 * @param {SubtitleToggleButtonProps} props - The props for the component.
 * @returns {React.ReactElement | null} The button, or nothing when the source has no subtitles.
 */
export const SubtitleToggleButton = ({ testID }: SubtitleToggleButtonProps = {}): React.ReactElement | null => {
  const buttonTestID = useTestID('subtitles-button', testID);
  const { textTrack, setTextTrack, textTracks } = useSettings();
  const [lastSelectedTrack, setLastSelectedTrack] = useState<TextTrack | null>(null);

  const isOff = isOffTrack(textTrack);
  const icon = isOff ? SubtitlesOff : Subtitles;

  // Remember the last track that was on, so turning subtitles back on restores it. Done during render:
  // an effect would commit an extra render.
  if (textTrack && !isOff && textTrack !== lastSelectedTrack) {
    setLastSelectedTrack(textTrack);
  }

  // Nothing to turn on: a source without subtitles shows no toggle rather than a dead button
  const hasSubtitles = textTracks.some((track) => !isOffTrack(track));

  const handleToggle = () => {
    if (isOff) {
      // The last track that was on, if this source still has its language; otherwise the first one
      const tracks = textTracks.filter((track) => !isOffTrack(track));
      const remembered = lastSelectedTrack && tracks.find((track) => isSameLanguage(track, lastSelectedTrack));
      const trackToUse = remembered ?? tracks[0] ?? null;
      if (trackToUse) setTextTrack(trackToUse);
    } else {
      setTextTrack(OFF_TEXT_TRACK);
    }
  };

  if (!hasSubtitles) return null;
  return <BaseIconButton IconComponent={icon} onTap={handleToggle} testID={buttonTestID} />;
};

export default SubtitleToggleButton;
