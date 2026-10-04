import type { TextTrack } from 'react-native-video';
import { BaseIconButton } from '../common';
import { Subtitles, SubtitlesOff } from '../svgs';
import { useSettings } from '../../hooks';
import { useState, useEffect } from 'react';

/**
 * A button that toggles subtitles on and off.
 *
 * @returns {React.ReactElement} The subtitle toggle button component.
 */
export const SubtitleToggleButton = () => {
  const { textTrack, setTextTrack, textTracks } = useSettings();
  const [lastSelectedTrack, setLastSelectedTrack] = useState<TextTrack | null>(null);

  // `null` means subtitles are off.
  const isOff = !textTrack;
  const icon = isOff ? SubtitlesOff : Subtitles;

  useEffect(() => {
    if (textTrack) {
      setLastSelectedTrack(textTrack);
    }
  }, [textTrack]);

  const handleToggle = () => {
    if (isOff) {
      setTextTrack(lastSelectedTrack ?? textTracks[0] ?? null);
    } else {
      setTextTrack(null);
    }
  };

  return <BaseIconButton IconComponent={icon} onTap={handleToggle} />;
};

export default SubtitleToggleButton;
