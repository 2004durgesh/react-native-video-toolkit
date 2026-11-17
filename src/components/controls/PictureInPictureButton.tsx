import { usePictureInPicture } from '../../hooks';
import { PictureInPicture, PictureInPictureExit } from '../svgs';
import { IconControl, type IconControlProps, type IconRenderer } from '../common/IconControl';

export interface PictureInPictureButtonProps extends IconControlProps {
  renderEnterIcon?: IconRenderer;
  renderExitIcon?: IconRenderer;
}

/**
 * A button that enters and exits picture-in-picture. Renders nothing where picture-in-picture
 * isn't supported.
 *
 * @param {PictureInPictureButtonProps} props - The props for the component.
 * @returns {React.ReactElement | null} The picture-in-picture button, or nothing.
 */
export const PictureInPictureButton = ({
  renderEnterIcon,
  renderExitIcon,
  ...props
}: PictureInPictureButtonProps): React.ReactElement | null => {
  const { pictureInPicture, supported, togglePictureInPicture } = usePictureInPicture();
  if (!supported) return null;
  return (
    <IconControl
      {...props}
      part="picture-in-picture-button"
      icon={pictureInPicture ? (renderExitIcon ?? PictureInPictureExit) : (renderEnterIcon ?? PictureInPicture)}
      label={pictureInPicture ? 'Exit picture in picture' : 'Picture in picture'}
      onTap={togglePictureInPicture}
    />
  );
};
