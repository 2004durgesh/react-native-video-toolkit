import { Tabs } from 'expo-router';

export default function TabsLayout() {
  // Expo Router only shows the screens a layout declares, in this order
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="icons" />
      <Tabs.Screen name="custom" />
      <Tabs.Screen name="components" />
    </Tabs>
  );
}
