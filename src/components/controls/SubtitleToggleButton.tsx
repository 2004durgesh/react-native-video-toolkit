import { BaseIconButton } from '../common';
import { Subtitles, SubtitlesOff } from '../svgs';
import { useSettings } from '../../hooks';
import { useState } from 'react';

/**
 * A button that toggles subtitles on and off.
 *
 * @returns {React.ReactElement} The subtitle toggle button component.
 */
export const SubtitleToggleButton = () => {
  const { textTrack, setTextTrack, textTracks } = useSettings();
  const [lastSelectedTrack, setLastSelectedTrack] = useState<any>(null);

  const isOff = !textTrack || textTrack.index === -1;
  const icon = isOff ? SubtitlesOff : Subtitles;

  // Remember the last track that was on, so turning subtitles back on restores it. Done during render:
  // an effect would commit an extra render.
  if (textTrack && textTrack.index !== -1 && textTrack !== lastSelectedTrack) {
    setLastSelectedTrack(textTrack);
  }

  const handleToggle = () => {
    if (isOff) {
      const trackToUse = lastSelectedTrack || textTracks[0] || null;
      setTextTrack(trackToUse);
    } else {
      // Turning off: set to off state
      setTextTrack({ index: -1, title: 'Off', language: 'off', type: 'disabled' });
    }
  };

  return <BaseIconButton IconComponent={icon} onTap={handleToggle} />;
};

export default SubtitleToggleButton;
