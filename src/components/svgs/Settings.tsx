import React from 'react';
import Svg, { Defs, FeComposite, FeFlood, FeGaussianBlur, FeMerge, FeMergeNode, Filter, Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';

export const Settings = (props: IconProps) => {
  return (
    <Svg width={props.size} height={props.size} viewBox="0 -960 960 960" {...props}>
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
        d="M480-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v200h-80v-200H160v480h320v80ZM380-300v-360l280 180-280 180ZM714-40l-12-60q-12-5-22.5-10.5T658-124l-58 18-40-68 46-40q-2-14-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T702-380l12-60h80l12 60q12 5 22.5 11t21.5 15l58-20 40 70-46 40q2 12 2 25t-2 25l46 40-40 68-58-18q-11 8-21.5 13.5T806-100l-12 60h-80Zm40-120q33 0 56.5-23.5T834-240q0-33-23.5-56.5T754-320q-33 0-56.5 23.5T674-240q0 33 23.5 56.5T754-160Z"
        fill={props.color}
        filter="url(#neon-glow)"
      />
    </Svg>
  );
};

export default Settings;
