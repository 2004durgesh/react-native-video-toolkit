import React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';

const Play = (props: SvgProps) => {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill= viewBox="0 -960 960 960" {...props}>
      <Path d="M320-200v-560l440 280-440 280Z" />
    </Svg>
  );
};

export default Play;
