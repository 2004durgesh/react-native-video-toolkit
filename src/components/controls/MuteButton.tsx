import { useVolume } from '../../hooks';
import { VolumeUp, VolumeOff } from '../svgs';
import { IconControl, type IconControlProps, type IconRenderer } from '../common/IconControl';

export interface MuteButtonProps extends IconControlProps {
  renderMuteIcon?: IconRenderer;
  renderUnmuteIcon?: IconRenderer;
}

/**
 * A button that mutes and unmutes the video.
 *
 * @param {MuteButtonProps} props - The props for the component.
 * @returns {React.ReactElement} The mute button component.
 */
export const MuteButton = ({ renderMuteIcon, renderUnmuteIcon, ...props }: MuteButtonProps): React.ReactElement => {
  const { muted, toggleMute } = useVolume();
  return (
    <IconControl
      {...props}
      part="mute-button"
      icon={muted ? (renderMuteIcon ?? VolumeOff) : (renderUnmuteIcon ?? VolumeUp)}
      label={muted ? 'Unmute' : 'Mute'}
      onTap={toggleMute}
    />
  );
};
