import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH =
  'M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Zm280-40h320v-240H440v240Zm80-80v-80h160v80H520Z';

export const PictureInPicture = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Hugs the edge of the outline, which reaches the edge of the box. */}
      {shadow && <IconShadow d={PATH} spread={80} offsetY={10} opacity={0.5} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default PictureInPicture;
