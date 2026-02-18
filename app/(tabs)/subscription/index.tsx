import React from 'react';
import { useRouter } from 'expo-router';
import { SubscriptionScreen } from '@/screens/subscription';

export default function SubscriptionPage() {
  const router = useRouter();

  return (
    <SubscriptionScreen
      onBack={() => router.back()}
      onPurchaseComplete={() => router.back()}
    />
  );
}
