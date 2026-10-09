import { type SvgProps } from 'react-native-svg';
export interface IconProps extends SvgProps {
  size?: number;
  color?: string;
  /**
   * Draw a soft drop shadow under the icon, so it stays readable over bright video.
   * Turn it off for icons on plain backgrounds, such as inside the settings menu.
   * @default true
   */
  shadow?: boolean;
}
