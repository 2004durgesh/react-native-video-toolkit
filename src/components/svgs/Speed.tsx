import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH =
  'M418-340q25 25 63 23.5t55-27.5l224-336-336 224q-26 18-28.5 54.5T418-340ZM204-160q-22 0-40.5-9.5T134-198q-26-47-40-97.5T80-400q0-83 31.5-156T197-683q54-54 127-85.5T480-800q82 0 154 31t126 84.5q54 53.5 86 125T879-406q1 55-12.5 107.5T825-198q-11 19-29.5 28.5T755-160H204Z';

export const Speed = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Hugs the edge of the dial, which spans the whole box. */}
      {shadow && <IconShadow d={PATH} spread={80} offsetY={10} opacity={0.5} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default Speed;
