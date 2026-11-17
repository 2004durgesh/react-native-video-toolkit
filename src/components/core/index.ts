import type { ComponentProps } from 'react';
import type { VideoSurface } from './VideoSurface';

export { VideoSurface } from './VideoSurface';

/**
 * Props for the VideoSurface component: react-native-video's props, plus `customAudioTracks` and
 * `customVideoTracks`.
 */
export type VideoSurfaceProps = ComponentProps<typeof VideoSurface>;
