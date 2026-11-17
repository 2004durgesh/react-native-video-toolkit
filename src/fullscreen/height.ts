/**
 * Height of the player in fullscreen. With screen rotation on, fullscreen is landscape, whose height is the window's
 * shorter side; that holds before and after the rotation lands, unlike a layout measured in one orientation.
 */
export function getFullscreenHeight(dimensions: { width: number; height: number }, rotates: boolean): number {
  return rotates ? Math.min(dimensions.width, dimensions.height) : dimensions.height;
}
