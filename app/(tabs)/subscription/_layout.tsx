import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="[screens]"
        options={{
        }}
      />
      <Stack.Screen
        name="send-gift"
        options={{
        }}
      />
      <Stack.Screen
        name="redeem-gift"
        options={{
        }}
      />
    </Stack>
  );
}
