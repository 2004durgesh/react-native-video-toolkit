import { createContext, useContext } from 'react';

/**
 * The `testID` a `VideoPlayer` gets without one of its own. Its parts' IDs start with it:
 * `video-play-button`, `video-settings-rate-1.5`...
 */
export const DEFAULT_VIDEO_TEST_ID = 'video';

/**
 * The `testID` of the nearest `VideoPlayer`, which its parts' IDs start with, so two players on a
 * screen have different IDs.
 * @internal
 */
export const TestIDContext = createContext(DEFAULT_VIDEO_TEST_ID);

/**
 * The player's `testID`.
 * @internal
 */
export const usePlayerTestID = (): string => useContext(TestIDContext);

/**
 * A part's `testID`: the one passed to it, else the player's followed by the part's name, such as
 * `video-play-button`.
 * @internal
 */
export const useTestID = (part: string, testID?: string): string => {
  const playerTestID = useContext(TestIDContext);
  return testID ?? `${playerTestID}-${part}`;
};
