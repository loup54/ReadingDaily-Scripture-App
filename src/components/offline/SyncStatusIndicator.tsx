/**
 * Sync Status Indicator Component
 * Displays synchronization status for offline data sync operations
 * Shows loading state with animated spinner and status message
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@constants';

export interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  itemsSynced?: number;
  itemsTotal?: number;
  message?: string;
  showCount?: boolean;
}

/**
 * SyncStatusIndicator - Shows real-time sync progress and status
 */
export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isSyncing,
  itemsSynced = 0,
  itemsTotal = 0,
  message = 'Syncing data...',
  showCount = true,
}) => {
  const slideAnim = useRef(new Animated.Value(isSyncing ? 0 : -100)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[SyncStatusIndicator] Sync status changed:', { isSyncing });

    // Animate slide in/out
    Animated.timing(slideAnim, {
      toValue: isSyncing ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSyncing, slideAnim]);

  useEffect(() => {
    if (!isSyncing) return;

    // Animate spinner rotation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [isSyncing, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressPercent =
    itemsTotal > 0 ? Math.round((itemsSynced / itemsTotal) * 100) : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: isSyncing ? 1 : 0,
        },
      ]}
      pointerEvents={isSyncing ? 'auto' : 'none'}
    >
      <View style={styles.indicator}>
        <Animated.View
          style={[
            styles.spinnerContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons name="sync" size={18} color={Colors.primary.blue} />
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.message}>{message}</Text>
          {showCount && itemsTotal > 0 && (
            <Text style={styles.count}>
              {itemsSynced} of {itemsTotal} ({progressPercent}%)
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinnerContainer: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  message: {
    ...Typography.body,
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  count: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
    fontWeight: '400',
  },
});
