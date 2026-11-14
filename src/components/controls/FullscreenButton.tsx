import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useFullscreen } from '../../hooks';
import { Maximize, Minimize } from '../svgs';
import { BaseIconButton } from '../common';
import { useTestID } from '../../utils/testIDs';

export interface FullscreenButtonProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  renderEnterIcon?: () => React.ReactNode;
  renderExitIcon?: () => React.ReactNode;
  /**
   * Identifies the button in end-to-end tests.
   * @default `video-fullscreen-button`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

/**
 * A button that toggles fullscreen mode.
 *
 * @param {FullscreenButtonProps} props - The props for the component.
 * @returns {React.ReactElement} - The fullscreen button component.
 */
export const FullscreenButton = ({
  size,
  color,
  style,
  renderEnterIcon,
  renderExitIcon,
  testID,
}: FullscreenButtonProps): React.ReactElement => {
  const buttonTestID = useTestID('fullscreen-button', testID);
  const { fullscreen, toggleFullscreen } = useFullscreen();

  const EnterIcon = renderEnterIcon || Maximize;
  const ExitIcon = renderExitIcon || Minimize;

  return (
    <BaseIconButton
      testID={buttonTestID}
      IconComponent={fullscreen ? ExitIcon : EnterIcon}
      size={size}
      color={color}
      style={[styles.fullscreenButton, style]}
      onTap={toggleFullscreen}
    />
  );
};

const styles = StyleSheet.create({
  fullscreenButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
