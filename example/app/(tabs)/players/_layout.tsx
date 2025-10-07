import { Stack } from 'expo-router';

export default function PlayersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="default" />
      <Stack.Screen name="custom" />
      {/* <Stack.Screen name="compound" />
      <Stack.Screen name="installation" /> */}
    </Stack>
  );
}
