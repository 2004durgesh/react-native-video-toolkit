import { BaseIconButton } from '../common';
import { Subtitles, SubtitlesOff } from '../svgs';
import { useSettings } from '../../hooks';
import { useState } from 'react';
import { useTestID } from '../../utils/testIDs';

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
  const [lastSelectedTrack, setLastSelectedTrack] = useState<any>(null);

  const isOff = !textTrack || textTrack.index === -1;
  const icon = isOff ? SubtitlesOff : Subtitles;

  // Remember the last track that was on, so turning subtitles back on restores it. Done during render:
  // an effect would commit an extra render.
  if (textTrack && textTrack.index !== -1 && textTrack !== lastSelectedTrack) {
    setLastSelectedTrack(textTrack);
  }

  // Nothing to turn on: a source without subtitles shows no toggle rather than a dead button
  const hasSubtitles = textTracks.some((track) => track.index !== -1);

  const handleToggle = () => {
    if (isOff) {
      // The last track that was on, if this source still has it; otherwise the first real track.
      // The list is sorted by index, so `textTracks[0]` is the "Off" entry itself.
      const remembered =
        lastSelectedTrack &&
        textTracks.find((track) => track.index !== -1 && track.language === lastSelectedTrack.language);
      const trackToUse = remembered ?? textTracks.find((track) => track.index !== -1) ?? null;
      if (trackToUse) setTextTrack(trackToUse);
    } else {
      // Turning off: set to off state
      setTextTrack({ index: -1, title: 'Off', language: 'off', type: 'disabled' });
    }
  };

  if (!hasSubtitles) return null;
  return <BaseIconButton IconComponent={icon} onTap={handleToggle} testID={buttonTestID} />;
};

export default SubtitleToggleButton;
