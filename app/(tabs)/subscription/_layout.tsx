import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="[screens]"
        options={{
          animationEnabled: false,
        }}
      />
      <Stack.Screen
        name="send-gift"
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="redeem-gift"
        options={{
          animationEnabled: true,
        }}
      />
    </Stack>
  );
}
