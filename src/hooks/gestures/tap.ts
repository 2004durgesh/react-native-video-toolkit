/**
 * How far a finger may move and still tap, in px. Further is a swipe, so the tap fails early and the
 * pan gestures can take over.
 * @internal
 */
export const TAP_MAX_DISTANCE = 10;

/** How long a tap may last, in ms. @internal */
export const TAP_MAX_DURATION = 250;

/** How far a double tap seeks by default, in seconds. @internal */
export const DEFAULT_SEEK_INTERVAL = 10;

/** The rate the video plays at while long-pressed. @internal */
export const BOOSTED_RATE = 2;
