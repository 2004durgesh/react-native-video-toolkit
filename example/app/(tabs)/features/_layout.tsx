import { Stack } from 'expo-router';

export default function FeaturesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="controls" />
      <Stack.Screen name="gestures" />
      {/* <Stack.Screen name="hooks" />
      <Stack.Screen name="api" /> */}
    </Stack>
  );
}
