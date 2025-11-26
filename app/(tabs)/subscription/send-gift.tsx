import React from 'react';
import { useRouter } from 'expo-router';
import { SendGiftScreen } from '@/screens/subscription';

export default function SendGiftPage() {
  const router = useRouter();

  return (
    <SendGiftScreen
      onBack={() => router.back()}
      onSendSuccess={() => router.back()}
    />
  );
}
