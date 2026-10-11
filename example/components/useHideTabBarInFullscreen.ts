import { useEffect } from 'react';
import { useNavigation } from 'expo-router';
import type { BottomTabNavigationProp } from 'expo-router/tabs';
import type { ParamListBase } from 'expo-router/react-navigation';
import { useVideo } from 'react-native-video-toolkit';

/**
 * Hides the tab bar while the player is fullscreen, so it doesn't cover the bottom controls.
 * Call it from a tab screen, inside the player's `VideoProvider`: the tabs layout sits above the
 * screens' providers, so it can't read their fullscreen state itself.
 */
export function useHideTabBarInFullscreen() {
  const { state } = useVideo();
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();

  useEffect(() => {
    // The tab bar uses the focused screen's `tabBarStyle`, and `undefined` brings back the default.
    navigation.setOptions({ tabBarStyle: state.fullscreen ? { display: 'none' } : undefined });
  }, [navigation, state.fullscreen]);
}
