import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH = 'm256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z';

export const Close = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Tight, so the thin strokes keep their shape. */}
      {shadow && <IconShadow d={PATH} spread={100} offsetY={12} opacity={0.55} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default Close;
