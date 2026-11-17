import { useFullscreen } from '../../hooks';
import { Maximize, Minimize } from '../svgs';
import { IconControl, type IconControlProps, type IconRenderer } from '../common/IconControl';

export interface FullscreenButtonProps extends IconControlProps {
  renderEnterIcon?: IconRenderer;
  renderExitIcon?: IconRenderer;
}

/**
 * A button that enters and exits fullscreen.
 *
 * @param {FullscreenButtonProps} props - The props for the component.
 * @returns {React.ReactElement} The fullscreen button component.
 */
export const FullscreenButton = ({
  renderEnterIcon,
  renderExitIcon,
  ...props
}: FullscreenButtonProps): React.ReactElement => {
  const { fullscreen, toggleFullscreen } = useFullscreen();
  return (
    <IconControl
      {...props}
      part="fullscreen-button"
      icon={fullscreen ? (renderExitIcon ?? Minimize) : (renderEnterIcon ?? Maximize)}
      label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      onTap={toggleFullscreen}
    />
  );
};
