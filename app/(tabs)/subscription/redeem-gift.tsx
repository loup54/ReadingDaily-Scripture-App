import React from 'react';
import { useRouter } from 'expo-router';
import { RedeemGiftScreen } from '@/screens/subscription';

export default function RedeemGiftPage() {
  const router = useRouter();

  return (
    <RedeemGiftScreen
      onBack={() => router.back()}
      onRedeemSuccess={() => router.back()}
    />
  );
}
