import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH = 'M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z';

export const ChevronLeft = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Tight, so the thin stroke keeps its shape. */}
      {shadow && <IconShadow d={PATH} spread={100} offsetY={12} opacity={0.55} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default ChevronLeft;
