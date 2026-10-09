import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH = 'M220-240v-480h80v480h-80Zm520 0L380-480l360-240v480Z';

export const SkipPrevious = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Soft like Play, a little tighter for the smaller shape. */}
      {shadow && <IconShadow d={PATH} spread={140} offsetY={18} opacity={0.5} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default SkipPrevious;
