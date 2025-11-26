/**
 * Download Status Overlay Component
 * Displays progress overlay for offline downloads
 * Shows reading/audio/translation pre-caching progress
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBookLoader } from '@components/common/AnimatedBookLoader';

export type DownloadType = 'readings' | 'audio' | 'translations';

export interface DownloadStatusOverlayProps {
  visible: boolean;
  type: DownloadType;
  progress: number; // 0-100
  currentItem: string;
  itemCount: number;
  completedCount: number;
  onCancel?: () => void;
  canCancel?: boolean;
}

/**
 * DownloadStatusOverlay - Full-screen overlay showing download progress
 */
export const DownloadStatusOverlay: React.FC<DownloadStatusOverlayProps> = ({
  visible,
  type,
  progress,
  currentItem,
  itemCount,
  completedCount,
  onCancel,
  canCancel = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[DownloadStatusOverlay] Download status changed:', {
      visible,
      type,
      progress,
    });

    // Animate modal appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: visible ? 1 : 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [visible, progress, fadeAnim, scaleAnim, progressAnim]);

  const getDownloadTypeIcon = () => {
    switch (type) {
      case 'audio':
        return 'volume-high';
      case 'translations':
        return 'language';
      case 'readings':
      default:
        return 'book';
    }
  };

  const getDownloadTypeLabel = () => {
    switch (type) {
      case 'audio':
        return 'Downloading Audio';
      case 'translations':
        return 'Pre-caching Translations';
      case 'readings':
      default:
        return 'Downloading Readings';
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.background.card, Colors.background.secondary]}
            style={styles.card}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Ionicons
                  name={getDownloadTypeIcon()}
                  size={28}
                  color={Colors.primary.blue}
                  style={styles.headerIcon}
                />
                <Text style={styles.title}>{getDownloadTypeLabel()}</Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Animated Book Loader */}
              <View style={styles.loaderContainer}>
                <AnimatedBookLoader
                  size={80}
                  color={Colors.primary.blue}
                />
              </View>

              {/* Current Item */}
              <View style={styles.currentItemSection}>
                <Text style={styles.currentItemLabel}>Current Item:</Text>
                <Text style={styles.currentItem} numberOfLines={2}>
                  {currentItem}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressWidth,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              </View>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Completed</Text>
                  <Text style={styles.statValue}>{completedCount}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Total</Text>
                  <Text style={styles.statValue}>{itemCount}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text style={styles.statValue}>{Math.max(0, itemCount - completedCount)}</Text>
                </View>
              </View>

              {/* Info Message */}
              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={Colors.primary.blue}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  {type === 'readings' && 'Downloading readings for offline access...'}
                  {type === 'audio' && 'Preparing audio files for offline listening...'}
                  {type === 'translations' && 'Pre-caching translations for faster access...'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            {canCancel && onCancel && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 380,
  },
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  header: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
    flex: 1,
  },
  content: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  currentItemSection: {
    marginBottom: Spacing.lg,
  },
  currentItemLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  currentItem: {
    ...Typography.body,
    color: Colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.blue,
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs / 2,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.ui.divider,
  },
  infoBox: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#E3F2FD',
    borderRadius: BorderRadius.md,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
    flexShrink: 0,
  },
  infoText: {
    fontSize: 12,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 16,
  },
  actions: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
