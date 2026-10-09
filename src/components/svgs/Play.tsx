import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH = 'M320-200v-560l440 280-440 280Z';

export const Play = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} viewBox="0 -960 960 960" {...props}>
      {/* Wide and soft: the large center button sits right over the video. */}
      {shadow && <IconShadow d={PATH} spread={180} offsetY={24} opacity={0.5} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default Play;
