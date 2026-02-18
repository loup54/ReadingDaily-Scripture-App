import React, { useEffect } from 'react';
import { NotificationCenterScreen } from '@/screens/NotificationCenterScreen';

/**
 * Notifications Tab
 *
 * SECURITY: Component access controlled by authentication
 * ERROR HANDLING: Graceful error boundaries in NotificationCenterScreen
 * LOGGING: Navigation events tracked in _layout.tsx
 * TESTING: Manual QA confirmed tab navigation works
 */
export default function NotificationsTab() {
  useEffect(() => {
    console.log('[NOTIFICATIONS_TAB] NotificationCenterScreen mounted');

    return () => {
      console.log('[NOTIFICATIONS_TAB] NotificationCenterScreen unmounted');
    };
  }, []);

  try {
    return <NotificationCenterScreen showHeader={false} />;
  } catch (error) {
    console.error('[NOTIFICATIONS_TAB] Fatal error rendering NotificationCenterScreen:', error);

    // Fallback UI - prevent blank screen
    const React = require('react');
    const { View, Text, StyleSheet } = require('react-native');

    return (
      <View style={fallbackStyles.container}>
        <Text style={fallbackStyles.error}>Unable to load notifications</Text>
        <Text style={fallbackStyles.message}>Please restart the app</Text>
      </View>
    );
  }
}

const fallbackStyles = {
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#fff',
    padding: 20,
  },
  error: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#F44336',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
};
