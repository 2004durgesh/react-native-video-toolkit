import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';

export const Pause = (props: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      <Path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z" />
    </Svg>
  );
};

export default Pause;
