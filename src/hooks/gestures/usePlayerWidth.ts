import { useVideoSelector } from '../../providers';

/**
 * The player's width, which gestures judge `event.x` against, since it's relative to the player and
 * the player needn't fill the window. The window's width until the video has been laid out.
 * @internal
 */
export const usePlayerWidth = (): number => {
  const windowWidth = useVideoSelector((state) => state.dimensions.width);
  return useVideoSelector((state) => state.videoLayout.width) || windowWidth;
};
