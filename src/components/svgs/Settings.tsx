import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH =
  'M480-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v200h-80v-200H160v480h320v80ZM380-300v-360l280 180-280 180ZM714-40l-12-60q-12-5-22.5-10.5T658-124l-58 18-40-68 46-40q-2-14-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T702-380l12-60h80l12 60q12 5 22.5 11t21.5 15l58-20 40 70-46 40q2 12 2 25t-2 25l46 40-40 68-58-18q-11 8-21.5 13.5T806-100l-12 60h-80Zm40-120q33 0 56.5-23.5T834-240q0-33-23.5-56.5T754-320q-33 0-56.5 23.5T674-240q0 33 23.5 56.5T754-160Z';

export const Settings = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} viewBox="0 -960 960 960" {...props}>
      {/* Hugs the edge of the large outline; the gear reaches the bottom of the box. */}
      {shadow && <IconShadow d={PATH} spread={60} offsetY={8} opacity={0.6} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default Settings;
