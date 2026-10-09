import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow } from './IconShadow';

const PATH =
  'M720-560H514L274-800h526q33 0 56.5 23.5T880-720v476q0 11-2 21t-8 19L594-480h126v-80ZM822-26 686-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800v112L26-822l56-56L878-82l-56 56ZM240-480h80v-48l-32-32h-48v80Zm206 80H240v80h286l-80-80Z';

export const SubtitlesOff = ({ shadow = true, ...props }: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {/* Hugs the edge and stays inside the narrow margin the slash leaves. */}
      {shadow && <IconShadow d={PATH} spread={60} offsetY={8} opacity={0.6} />}
      <Path d={PATH} fill={props.color} />
    </Svg>
  );
};

export default SubtitlesOff;
