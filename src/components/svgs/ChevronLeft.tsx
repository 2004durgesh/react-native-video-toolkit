import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';

export const ChevronLeft = (props: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      <Path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z" />
    </Svg>
  );
};

export default ChevronLeft;
