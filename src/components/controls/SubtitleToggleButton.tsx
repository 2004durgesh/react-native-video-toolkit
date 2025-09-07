import { BaseIconButton } from '../common';
import { Captions, CaptionsOff } from 'lucide-react-native';
import { useSettings } from '../../hooks';
import { useState, useEffect } from 'react';

/**
 * A button that toggles subtitles on and off.
 *
 * @returns {React.ReactElement} The subtitle toggle button component.
 */
export const SubtitleToggleButton = () => {
  const { textTrack, setTextTrack, textTracks } = useSettings();
  const [lastSelectedTrack, setLastSelectedTrack] = useState<any>(null);

  const isOff = !textTrack || textTrack.index === -1;
  const icon = isOff ? CaptionsOff : Captions;

  useEffect(() => {
    if (textTrack && textTrack.index !== -1) {
      setLastSelectedTrack(textTrack);
    }
  }, [textTrack]);

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
