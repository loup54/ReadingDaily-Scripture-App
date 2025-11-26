import { Stack } from 'expo-router';

export default function NotificationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Notifications',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Notification Settings',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
