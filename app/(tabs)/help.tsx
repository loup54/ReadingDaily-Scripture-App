import React from 'react';
import { useRouter } from 'expo-router';
import { HelpScreen } from '@/screens/help';

export default function HelpPage() {
  const router = useRouter();

  return <HelpScreen onBack={() => router.back()} />;
}
