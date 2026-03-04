/**
 * Tabs Layout
 * Phase 4: Navigation & Flow - Tab Navigation with Animations
 *
 * Main tab navigation for authenticated users.
 * Manages transitions between readings, practice, progress, notifications, and settings.
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@constants';

export default function TabsLayout() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('[TAB_NAVIGATION] Current segments:', segments);
    console.log('[TAB_NAVIGATION] Active route:', segments[segments.length - 1]);
  }, [segments]);

  // Android needs extra bottom padding for gesture navigation
  const bottomPadding = Platform.OS === 'android'
    ? Math.max(insets.bottom, 8)
    : 8;
  const tabBarHeight = Platform.OS === 'android'
    ? 65 + Math.max(insets.bottom - 8, 0)
    : 65;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary.blue,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: Colors.background.card,
          borderTopWidth: 1,
          borderTopColor: Colors.ui.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        /**
         * Phase 4: Tab navigation uses standard animations
         * Quick transitions between tab screens
         *
         * LOGGING: Navigation state logged on every tab change
         */
      }}
    >
      <Tabs.Screen
        name="readings"
        options={{
          title: 'Readings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            console.log('[TAB_PRESS] Notifications tab pressed', {
              target: e.target,
              canPreventDefault: e.defaultPrevented,
              timestamp: new Date().toISOString(),
            });
          },
          focus: () => {
            console.log('[TAB_FOCUS] Notifications tab focused');
          },
          blur: () => {
            console.log('[TAB_BLUR] Notifications tab blurred');
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="legal-documents"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="backup-export"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="compliance-analytics"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
