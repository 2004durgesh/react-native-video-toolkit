import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../types/svg';
import { IconShadow, type IconShadowSpec } from './IconShadow';

/**
 * An icon component from a path in the icons' 960-unit viewBox, with its soft shadow. The component
 * takes `size`, `color` and `shadow` (on by default), and any other SVG props.
 * @internal
 */
export const createIcon = (path: string, shadowSpec: IconShadowSpec) => {
  const Icon = ({ shadow = true, ...props }: IconProps) => (
    <Svg width={props.size} height={props.size} fill={props.color} viewBox="0 -960 960 960" {...props}>
      {shadow && <IconShadow d={path} {...shadowSpec} />}
      <Path d={path} fill={props.color} />
    </Svg>
  );
  return Icon;
};
