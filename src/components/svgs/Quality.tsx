import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH =
  'M240-360h60v-80h80v80h60v-240h-60v100h-80v-100h-60v240Zm280 0h160q17 0 28.5-11.5T720-400v-160q0-17-11.5-28.5T680-600H520v240Zm60-60v-120h80v120h-80ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z';

export const Quality = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Hugs the edge, so the solid box doesn't turn into a dark slab. */}
      {shadow && <IconShadow d={PATH} spread={80} offsetY={10} opacity={0.45} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default Quality;
