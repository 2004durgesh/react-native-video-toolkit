import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH =
  'M160-160q-33 0-56.5-23.5T80-240v-280h80v280h640v-480H440v-80h360q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm523-140 57-57-124-123h104v-80H480v240h80v-103l123 123ZM80-600v-200h280v200H80Zm400 120Z';

export const PictureInPictureExit = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Hugs the edge of the outline, which reaches the edge of the box. */}
      {shadow && <IconShadow d={PATH} spread={70} offsetY={8} opacity={0.55} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default PictureInPictureExit;
