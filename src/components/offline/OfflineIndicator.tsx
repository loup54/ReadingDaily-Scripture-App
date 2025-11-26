/**
 * Offline Indicator Component
 * Displays network connectivity status at the top of screens
 * Shows real-time network state with color-coded indicators
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@constants';
import { NetworkStatusService, NetworkState } from '@/services/network/NetworkStatusService';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  position?: 'top' | 'bottom';
  animated?: boolean;
}

/**
 * OfflineIndicator - Shows network status with animated state changes
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = false,
  position = 'top',
  animated = true,
}) => {
  const [networkState, setNetworkState] = useState<NetworkState>(
    NetworkStatusService.getCurrentState()
  );
  const [isVisible, setIsVisible] = useState(!networkState.isConnected);
  const slideAnim = React.useRef(new Animated.Value(isVisible ? 0 : -100)).current;

  useEffect(() => {
    console.log('[OfflineIndicator] Component mounted');

    // Subscribe to network changes
    const unsubscribe = NetworkStatusService.onNetworkChange((state) => {
      console.log('[OfflineIndicator] Network state changed:', state);
      setNetworkState(state);
      setIsVisible(!state.isConnected);

      // Animate in/out
      if (animated) {
        Animated.timing(slideAnim, {
          toValue: state.isConnected ? -100 : 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    return () => {
      console.log('[OfflineIndicator] Cleaning up');
      unsubscribe();
    };
  }, [animated, slideAnim]);

  const getStatusIcon = () => {
    if (networkState.isConnected) {
      return 'wifi';
    }
    return 'alert-circle-outline';
  };

  const getStatusColor = () => {
    if (networkState.isConnected) {
      return Colors.success;
    }
    return Colors.error;
  };

  const getStatusText = () => {
    if (!networkState.isConnected) {
      return 'Offline - Limited functionality';
    }
    if (networkState.type === 'wifi') {
      return 'WiFi Connected';
    }
    if (networkState.type === 'cellular') {
      return 'Cellular Connected';
    }
    return 'Online';
  };

  const containerStyle =
    position === 'top'
      ? [styles.containerTop, { transform: [{ translateY: slideAnim }] }]
      : [styles.containerBottom, { transform: [{ translateY: slideAnim }] }];

  return (
    <Animated.View
      style={containerStyle}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: getStatusColor(),
            opacity: isVisible ? 1 : 0,
          },
        ]}
      >
        <View style={styles.content}>
          <Ionicons
            name={getStatusIcon()}
            size={16}
            color={Colors.text.white}
            style={styles.icon}
          />
          <Text style={styles.text}>{getStatusText()}</Text>
        </View>

        {showDetails && networkState.ipAddress && (
          <Text style={styles.details}>{networkState.ipAddress}</Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  containerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  containerBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  indicator: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    color: Colors.text.white,
    fontSize: 13,
    fontWeight: '600',
  },
  details: {
    color: Colors.text.white,
    fontSize: 11,
    fontWeight: '400',
    marginLeft: Spacing.sm,
    opacity: 0.8,
  },
});
