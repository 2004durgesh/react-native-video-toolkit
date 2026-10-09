import { G, Path } from 'react-native-svg';

/**
 * Shadow tuning for one icon, in the icons' 960-unit viewBox (40 units is about 1px on a 24px icon).
 */
export interface IconShadowSpec {
  /** Width of the softest layer. The shadow reaches half of it past the icon's edge. */
  spread: number;
  /** How far the shadow drops below the icon. */
  offsetY: number;
  /** Overall strength, from 0 to 1. */
  opacity: number;
}

/**
 * Stacked strokes, from wide and faint to narrow and darker, that fade out like a blur. SVG filters
 * would be the textbook tool, but react-native-svg renders them differently per platform (a grey box
 * on iOS) and re-runs them on every render. Strokes only, so cut-outs in an icon stay see-through.
 */
const LAYERS = [
  { width: 1, opacity: 0.3 },
  { width: 0.55, opacity: 0.4 },
  { width: 0.2, opacity: 0.5 },
];

/**
 * A soft drop shadow for an icon path. Render it before the icon's own `Path`.
 *
 * @param {IconShadowSpec & { d: string }} props - The icon's path data and shadow tuning.
 * @returns {React.ReactElement} The shadow layers.
 */
export const IconShadow = ({ d, spread, offsetY, opacity }: IconShadowSpec & { d: string }): React.ReactElement => (
  // A transform string, not `translateY`: react-native-svg passes `translateY` to the DOM on web.
  <G transform={`translate(0 ${offsetY})`}>
    {LAYERS.map((layer) => (
      <Path
        key={layer.width}
        d={d}
        fill="none"
        stroke="#000"
        strokeWidth={spread * layer.width}
        strokeOpacity={opacity * layer.opacity}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    ))}
  </G>
);
