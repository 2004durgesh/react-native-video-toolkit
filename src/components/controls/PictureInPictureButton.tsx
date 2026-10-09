import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { usePictureInPicture } from '../../hooks';
import { PictureInPicture, PictureInPictureExit } from '../svgs';
import { BaseIconButton } from '../common';

export interface PictureInPictureButtonProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  renderEnterIcon?: () => React.ReactNode;
  renderExitIcon?: () => React.ReactNode;
}

/**
 * A button that moves the video into a floating picture-in-picture window and back.
 * Renders nothing where picture-in-picture can't work (see `isPictureInPictureSupported`).
 * Picture-in-picture needs native setup; see `usePictureInPicture`.
 *
 * @param {PictureInPictureButtonProps} props - The props for the component.
 * @returns {React.ReactElement | null} - The picture-in-picture button, or `null` when unsupported.
 */
export const PictureInPictureButton = ({
  size,
  color,
  style,
  renderEnterIcon,
  renderExitIcon,
}: PictureInPictureButtonProps): React.ReactElement | null => {
  const { pictureInPicture, supported, togglePictureInPicture } = usePictureInPicture();

  const EnterIcon = renderEnterIcon || PictureInPicture;
  const ExitIcon = renderExitIcon || PictureInPictureExit;

  if (!supported) {
    return null;
  }

  return (
    <BaseIconButton
      IconComponent={pictureInPicture ? ExitIcon : EnterIcon}
      size={size}
      color={color}
      style={[styles.pictureInPictureButton, style]}
      onTap={togglePictureInPicture}
    />
  );
};

const styles = StyleSheet.create({
  pictureInPictureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
