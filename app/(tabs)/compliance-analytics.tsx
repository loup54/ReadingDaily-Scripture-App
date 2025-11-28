/**
 * Compliance & Analytics Screen Route
 * Phase 6: Compliance & Analytics
 *
 * Route wrapper for the ComplianceAnalyticsScreen
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ComplianceAnalyticsScreen } from '@/screens/legal/ComplianceAnalyticsScreen';
import { Colors } from '@constants';

export default function ComplianceAnalyticsRoute() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ComplianceAnalyticsScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
});
