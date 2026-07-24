import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Root layout. Becomes a tab navigator later — one tab per feature.
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
