import React from 'react';
import Svg, { Defs, FeComposite, FeFlood, FeGaussianBlur, FeMerge, FeMergeNode, Filter, Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';

export const SubtitlesOff = (props: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      <Defs>
        <Filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          {/* 1. Create the glow color (e.g., Black or a bright color) */}
          <FeFlood result="flood" floodColor="#000" floodOpacity="1" />

          {/* 2. Cut out the shape of the icon from the flood */}
          <FeComposite in="flood" in2="SourceGraphic" operator="in" result="mask" />

          {/* 3. Blur the result to create the glow */}
          <FeGaussianBlur in="mask" stdDeviation="40" result="blurred" />

          {/* 4. Merge the blur (bottom) and the original icon (top) */}
          <FeMerge>
            <FeMergeNode in="blurred" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>
      <Path
        d="M720-560H514L274-800h526q33 0 56.5 23.5T880-720v476q0 11-2 21t-8 19L594-480h126v-80ZM822-26 686-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800v112L26-822l56-56L878-82l-56 56ZM240-480h80v-48l-32-32h-48v80Zm206 80H240v80h286l-80-80Z"
        fill={props.color}
        filter="url(#neon-glow)"
      />
    </Svg>
  );
};

export default SubtitlesOff;
