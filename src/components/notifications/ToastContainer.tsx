/**
 * Toast Container Component
 * Phase 10B.5: In-App Toast Component
 *
 * Manages display and positioning of multiple toast notifications
 * Renders toasts in stacks at different screen positions
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ToastNotification, ToastPosition } from './ToastNotification';
import { useToasts, useDismissToast, useToastsByPosition } from '@/stores/useToastStore';

/**
 * Toast Container Component
 * Should be placed at root level of app (e.g., in Stack.Screen wrapper)
 */
export function ToastContainer() {
  const allToasts = useToasts();
  const dismissToast = useDismissToast();

  // Group toasts by position
  const topToasts = allToasts.filter((t) => t.position === ToastPosition.TOP);
  const centerToasts = allToasts.filter((t) => t.position === ToastPosition.CENTER);
  const bottomToasts = allToasts.filter((t) => t.position === ToastPosition.BOTTOM);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Position Toasts */}
      <View style={styles.topContainer} pointerEvents="box-none">
        {topToasts.map((toast, index) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            index={index}
          />
        ))}
      </View>

      {/* Center Position Toasts */}
      <View style={styles.centerContainer} pointerEvents="box-none">
        {centerToasts.map((toast, index) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            index={index}
          />
        ))}
      </View>

      {/* Bottom Position Toasts */}
      <View style={styles.bottomContainer} pointerEvents="box-none">
        {bottomToasts.map((toast, index) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
    zIndex: 9999,
  },
  topContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
});
