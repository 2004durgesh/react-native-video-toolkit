import { Stack } from 'expo-router';

export default function StylingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="themes" />
      <Stack.Screen name="customization" />
      <Stack.Screen name="responsive" />
    </Stack>
  );
}
