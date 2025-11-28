import React from 'react';
import { useRouter } from 'expo-router';
import { BackupExportScreen } from '@/screens/legal/BackupExportScreen';

export default function BackupExportPage() {
  const router = useRouter();

  return <BackupExportScreen onBack={() => router.back()} />;
}
