import { StyleSheet } from 'react-native';
import { useSettings } from '../../hooks';
import { Settings } from '../svgs';
import { BaseIconButton } from '../common/BaseIconButton';

export interface SettingsButtonProps {
  size?: number;
  color?: string;
  style?: any;
  renderSettingIcon?: () => React.ReactNode;
}

/**
 * A button that opens the settings menu.
 *
 * @param {SettingsButtonProps} props - The props for the component.
 * @returns {React.ReactElement} - The settings button component.
 */
export const SettingsButton = ({ size, color, style, renderSettingIcon }: SettingsButtonProps): React.ReactElement => {
  const { openSettings } = useSettings();
  const SettingsIcon = renderSettingIcon || Settings;
  return (
    <BaseIconButton
      IconComponent={SettingsIcon}
      size={size}
      color={color}
      onTap={openSettings}
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
