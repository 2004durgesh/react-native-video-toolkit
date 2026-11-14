import { StyleSheet } from 'react-native';
import { useSettings } from '../../hooks';
import { Settings } from '../svgs';
import { BaseIconButton } from '../common/BaseIconButton';
import { useTestID } from '../../utils/testIDs';

export interface SettingsButtonProps {
  size?: number;
  color?: string;
  style?: any;
  renderSettingIcon?: () => React.ReactNode;
  /**
   * Identifies the button in end-to-end tests.
   * @default `video-settings-button`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

/**
 * A button that opens the settings menu.
 *
 * @param {SettingsButtonProps} props - The props for the component.
 * @returns {React.ReactElement} - The settings button component.
 */
export const SettingsButton = ({
  size,
  color,
  style,
  renderSettingIcon,
  testID,
}: SettingsButtonProps): React.ReactElement => {
  const buttonTestID = useTestID('settings-button', testID);
  const { openSettings } = useSettings();
  const SettingsIcon = renderSettingIcon || Settings;
  return (
    <BaseIconButton
      IconComponent={SettingsIcon}
      size={size}
      color={color}
      onTap={openSettings}
      testID={buttonTestID}
      style={[styles.SettingsButton, style]}
    />
  );
};

const styles = StyleSheet.create({
  SettingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
