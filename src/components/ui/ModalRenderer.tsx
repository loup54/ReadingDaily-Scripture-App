/**
 * Modal Renderer Component
 * Phase 2: Navigation & Flow - Global Modal Rendering
 *
 * Renders the active modal from the global modal stack.
 * Place this in RootLayout to render modals globally.
 * Only the top modal in the stack is rendered.
 */

import React, { useMemo } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useModalStack } from '@/hooks/useModalStack';
import { TrialExpiredModal } from '@/components/trial/TrialExpiredModal';
import { FeatureDiscoveryPrompt } from '@/components/common/FeatureDiscoveryPrompt';
import { DailyLimitReachedDialog } from '@/components/common/DailyLimitReachedDialog';
import AvatarPicker from '@/components/settings/AvatarPicker';
import TimePicker from '@/components/settings/TimePicker';

/**
 * Map modal IDs to component renderers
 * Add entries for each modal type in your app
 */
const MODAL_RENDERERS: Record<string, (props: any) => React.ReactElement | null> = {
  'trial-expired': (props) => (
    <TrialExpiredModal
      visible={true}
      lifetimePrice={props.data?.price || 29.99}
      onPurchase={() => {
        props.onAction?.();
        props.dismiss();
      }}
      onDismiss={() => props.dismiss()}
    />
  ),

  'feature-discovery': (props) => (
    <FeatureDiscoveryPrompt
      visible={true}
      featureId={props.data?.featureId || ''}
      title={props.data?.title || 'Did you know?'}
      description={props.data?.description || ''}
      actionLabel={props.data?.actionLabel || 'Try it'}
      icon={props.data?.icon}
      gradientStart={props.data?.gradientStart}
      gradientEnd={props.data?.gradientEnd}
      onAction={() => {
        props.onAction?.();
        props.dismiss();
      }}
      onDismiss={() => props.dismiss()}
    />
  ),

  'daily-limit-reached': (props: any) => (
    <DailyLimitReachedDialog
      visible={true}
      minutesUsed={props.data?.minutesUsed || 10}
      onDismiss={() => props.dismiss()}
      onUpgradePress={() => {
        props.onAction?.();
        props.dismiss();
      }}
    />
  ),

  'avatar-picker': (props: any) => (
    <AvatarPicker
      visible={true}
      onAvatarSelected={(avatar: any) => {
        props.data?.onAvatarSelected?.(avatar);
        props.onAction?.();
        props.dismiss();
      }}
      onCancel={() => props.dismiss()}
    />
  ),

  'time-picker': (props: any) => (
    <TimePicker
      visible={true}
      initialTime={props.data?.initialTime}
      onTimeSelected={(time: any) => {
        props.data?.onTimeSelected?.(time);
        props.onAction?.();
        props.dismiss();
      }}
      onCancel={() => props.dismiss()}
    />
  ),
};

export interface ModalRendererProps {
  /**
   * Optional custom modal renderers
   * Merged with default renderers
   */
  customRenderers?: Record<string, (props: any) => React.ReactElement | null>;

  /**
   * Whether to show debug info (console logs)
   */
  debug?: boolean;
}

/**
 * ModalRenderer - Renders active modal from global stack
 *
 * Usage in RootLayout:
 * <ModalRenderer debug={true} />
 *
 * The component:
 * 1. Subscribes to modal stack changes
 * 2. Renders only the top (active) modal
 * 3. Handles backdrop taps for dismissal
 * 4. Manages modal transitions
 */
export const ModalRenderer: React.FC<ModalRendererProps> = ({
  customRenderers = {},
  debug = false,
}) => {
  const { activeModal, dismiss, executeAction } = useModalStack();

  // Merge custom renderers with defaults
  const allRenderers = useMemo(
    () => ({
      ...MODAL_RENDERERS,
      ...customRenderers,
    }),
    [customRenderers]
  );

  if (!activeModal) {
    if (debug) {
      console.log('[ModalRenderer] No active modal to render');
    }
    return null;
  }

  const { config } = activeModal;
  const renderer = allRenderers[config.id];

  if (!renderer) {
    if (debug) {
      console.warn(`[ModalRenderer] ⚠️  No renderer found for modal: ${config.id}`);
    }
    return null;
  }

  if (debug) {
    console.log(`[ModalRenderer] 🎬 Rendering modal: ${config.id} (priority: ${config.priority})`);
  }

  return renderer({
    data: config.data,
    dismiss: () => dismiss(config.id),
    onAction: () => executeAction(config.id),
  });
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
