import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH = 'M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z';

export const Pause = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Wide and soft like Play, a little tighter around the narrower bars. */}
      {shadow && <IconShadow d={PATH} spread={160} offsetY={20} opacity={0.5} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default Pause;
