import { useSettings } from '../../hooks';
import { Settings } from '../svgs';
import { IconControl, type IconControlProps, type IconRenderer } from '../common/IconControl';

export interface SettingsButtonProps extends IconControlProps {
  renderSettingIcon?: IconRenderer;
}

/**
 * A button that opens the settings menu. `Menu.Trigger` is the same button.
 *
 * @param {SettingsButtonProps} props - The props for the component.
 * @returns {React.ReactElement} The settings button component.
 */
export const SettingsButton = ({ renderSettingIcon, ...props }: SettingsButtonProps): React.ReactElement => {
  const { openSettings } = useSettings();
  return (
    <IconControl
      {...props}
      part="settings-button"
      icon={renderSettingIcon ?? Settings}
      label="Settings"
      onTap={openSettings}
      // The remote comes back here as the menu closes
      tvFocusTarget="settings"
    />
  );
};
