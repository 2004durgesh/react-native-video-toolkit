import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useVideoSelector } from '../providers';
import { usePlayerCommands } from '../providers/PlayerCommands';
import { PlatformUtils } from '../utils/platform';
import { onPlatformFullscreenExit } from './platform';

/**
 * Leaves fullscreen the ways the platform offers besides the button: the browser's Esc and its own
 * controls, and Android's back button (as in other video apps, instead of leaving the screen). A
 * menu open over the player registers its back handler later, so back closes the menu first.
 * @internal
 */
export const useFullscreenExits = (): void => {
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  const { exitFullscreen } = usePlayerCommands();

  useEffect(() => onPlatformFullscreenExit(exitFullscreen), [exitFullscreen]);

  useEffect(() => {
    if (!fullscreen || !PlatformUtils.isAndroid() || PlatformUtils.isTV()) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      exitFullscreen();
      return true;
    });
    return () => subscription.remove();
  }, [fullscreen, exitFullscreen]);
};
