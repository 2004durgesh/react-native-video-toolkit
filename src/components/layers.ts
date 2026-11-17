/**
 * The stacking order of the layers inside a player, on web, where they need a z-index to stay above
 * the video element: the controls, then overlays such as UpNext's card above them.
 * @internal
 */
export const PLAYER_LAYERS = { controls: 10, overlays: 20 } as const;
