import { usePlayback } from '../../hooks';
import { Pause, Play } from '../svgs';
import { IconControl, type IconControlProps, type IconRenderer } from '../common/IconControl';

export interface PlayButtonProps extends IconControlProps {
  renderPlayIcon?: IconRenderer;
  renderPauseIcon?: IconRenderer;
}

/**
 * A button that plays and pauses the video.
 *
 * @param {PlayButtonProps} props - The props for the component.
 * @returns {React.ReactElement} The play button component.
 */
export const PlayButton = ({ renderPlayIcon, renderPauseIcon, ...props }: PlayButtonProps): React.ReactElement => {
  const { isPlaying, togglePlayPause } = usePlayback();
  return (
    <IconControl
      {...props}
      part="play-button"
      icon={isPlaying ? (renderPauseIcon ?? Pause) : (renderPlayIcon ?? Play)}
      label={isPlaying ? 'Pause' : 'Play'}
      onTap={togglePlayPause}
      // The TV remote lands here when the controls come up
      tvFocusTarget="play"
    />
  );
};
