import React from 'react';
import { useRouter } from 'expo-router';
import { LegalDocumentsScreen } from '@/screens/legal/LegalDocumentsScreen';

export default function LegalDocumentsPage() {
  const router = useRouter();

  // Navigate back to settings tab explicitly instead of router.back()
  // which might navigate to readings if that was the previous screen
  const handleBack = () => {
    router.push('/(tabs)/settings');
  };

  return <LegalDocumentsScreen onBack={handleBack} />;
}
