import React from 'react';
import Svg, { Defs, FeComposite, FeFlood, FeGaussianBlur, FeMerge, FeMergeNode, Filter, Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';

export const VolumeUp = (props: IconProps) => {
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
        d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320Z"
        fill={props.color}
        filter="url(#neon-glow)"
      />
    </Svg>
  );
};

export default VolumeUp;
