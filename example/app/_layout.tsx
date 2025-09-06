import { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Slot } from 'expo-router';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';

export default function Layout() {
  useEffect(() => {
    if (Platform.isTV) {
      RNOrientationDirector.lockTo(Orientation.landscape);
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
}
