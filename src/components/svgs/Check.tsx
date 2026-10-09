import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH = 'M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z';

export const Check = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Tight, so the thin stroke keeps its shape. */}
      {shadow && <IconShadow d={PATH} spread={100} offsetY={12} opacity={0.55} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default Check;
