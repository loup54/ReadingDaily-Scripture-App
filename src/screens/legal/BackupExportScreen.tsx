/**
 * Backup Export Screen
 *
 * Complete UI for backup management:
 * - Create local backups
 * - Export as ZIP
 * - Restore from backup
 * - View backup history
 * - Manage cloud backups
 * - Configure auto-backup
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import BackupService, { BackupFile } from '@/services/legal/BackupService';
import CloudBackupService, { CloudBackup } from '@/services/legal/CloudBackupService';
import BackupScheduleService from '@/services/legal/BackupScheduleService';

interface Tab {
  id: 'backup' | 'export' | 'restore' | 'history';
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'backup', label: 'Backup', icon: 'cloud-upload-outline' },
  { id: 'export', label: 'Export', icon: 'download-outline' },
  { id: 'restore', label: 'Restore', icon: 'cloud-download-outline' },
  { id: 'history', label: 'History', icon: 'time-outline' },
];

/**
 * Backup Card Component
 */
const BackupCard: React.FC<{
  backup: BackupFile | CloudBackup;
  onRestore: () => void;
  onDelete: () => void;
  colors: any;
}> = ({ backup, onRestore, onDelete, colors }) => {
  const createdDate = new Date(backup.createdAt).toLocaleDateString();
  const createdTime = new Date(backup.createdAt).toLocaleTimeString();
  const sizeInMB = (backup.size / 1024 / 1024).toFixed(2);
  const isCloudBackup = 'cloudId' in backup;

  return (
    <View style={[styles.backupCard, { backgroundColor: colors.background.card }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.backupIcon,
              {
                backgroundColor: isCloudBackup
                  ? colors.primary.blue + '20'
                  : colors.text.tertiary + '20',
              },
            ]}
          >
            <Ionicons
              name={isCloudBackup ? 'cloud' : 'document'}
              size={20}
              color={isCloudBackup ? colors.primary.blue : colors.text.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.backupTime, { color: colors.text.primary }]}>
              {createdDate} at {createdTime}
            </Text>
            <Text style={[styles.backupSize, { color: colors.text.secondary }]}>
              {sizeInMB} MB • {backup.contents.documentCount} docs • {backup.contents.signatureCount}{' '}
              signatures
            </Text>
            {backup.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.accent.green} />
                <Text style={[styles.verifiedText, { color: Colors.accent.green }]}>
                  Verified
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary.blue }]}
            onPress={onRestore}
          >
            <Ionicons name="download-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.accent.red + '40' }]}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.accent.red} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/**
 * Backup Info Card
 */
const BackupInfoCard: React.FC<{
  title: string;
  value: string;
  icon: string;
  colors: any;
}> = ({ title, value, icon, colors }) => (
  <View style={[styles.infoCard, { backgroundColor: colors.background.card }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
      <Ionicons name={icon} size={20} color={colors.primary.blue} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>{title}</Text>
        <Text style={[styles.infoValue, { color: colors.text.primary }]}>{value}</Text>
      </View>
    </View>
  </View>
);

/**
 * Main BackupExportScreen Component
 */
export const BackupExportScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'backup' | 'export' | 'restore' | 'history'>(
    'backup'
  );
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [cloudBackups, setCloudBackups] = useState<CloudBackup[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const [nextBackupTime, setNextBackupTime] = useState<Date | null>(null);
  const [daysUntilBackup, setDaysUntilBackup] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load backups on mount
  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = useCallback(async () => {
    try {
      setLoading(true);

      // Load local backups
      const localBackups = await BackupService.getLocalBackups();
      setBackups(localBackups);

      // Load cloud backups
      const cloudBackups = await CloudBackupService.getCloudBackups('current-user');
      setCloudBackups(cloudBackups);

      // Load schedule info
      const autoBkup = await BackupScheduleService.isAutoBackupEnabled();
      setAutoBackupEnabled(autoBkup);

      const lastTime = await BackupScheduleService.getLastBackupTime();
      setLastBackupTime(lastTime);

      const nextTime = await BackupScheduleService.getNextBackupTime();
      setNextBackupTime(nextTime);

      const days = await BackupScheduleService.getDaysUntilNextBackup();
      setDaysUntilBackup(days);
    } catch (error) {
      console.error('[BackupExportScreen] Failed to load backup data:', error);
      Alert.alert('Error', 'Failed to load backup data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateBackup = useCallback(async () => {
    try {
      setLoading(true);
      Alert.alert(
        'Create Backup',
        'Do you want to protect this backup with a password?',
        [
          {
            text: 'No, Skip',
            onPress: async () => {
              const backup = await BackupService.createLocalBackup();
              if (backup) {
                Alert.alert('Success', 'Backup created successfully');
                loadBackupData();
              } else {
                Alert.alert('Error', 'Failed to create backup');
              }
            },
          },
          {
            text: 'Yes, Set Password',
            onPress: () => {
              setPassword('');
              setConfirmPassword('');
              setShowPasswordModal(true);
            },
          },
        ]
      );
    } catch (error) {
      console.error('[BackupExportScreen] Backup creation failed:', error);
      Alert.alert('Error', 'Failed to create backup');
    } finally {
      setLoading(false);
    }
  }, [loadBackupData]);

  const handlePasswordBackup = useCallback(async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const backup = await BackupService.createLocalBackup(password);
      if (backup) {
        setShowPasswordModal(false);
        Alert.alert('Success', 'Password-protected backup created successfully');
        loadBackupData();
      } else {
        Alert.alert('Error', 'Failed to create backup');
      }
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, loadBackupData]);

  const handleToggleAutoBackup = useCallback(async (enabled: boolean) => {
    try {
      await BackupScheduleService.setAutoBackupEnabled(enabled);
      setAutoBackupEnabled(enabled);
      if (enabled) {
        await BackupScheduleService.initializeMonthlySchedule();
        Alert.alert('Success', 'Auto backup enabled - monthly schedule set');
      } else {
        Alert.alert('Success', 'Auto backup disabled');
      }
    } catch (error) {
      console.error('[BackupExportScreen] Failed to toggle auto backup:', error);
      Alert.alert('Error', 'Failed to update auto backup setting');
    }
  }, []);

  const handleDeleteBackup = useCallback(
    async (backupId: string) => {
      Alert.alert('Delete Backup', 'Are you sure? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await BackupService.deleteLocalBackup(backupId);
              if (success) {
                Alert.alert('Success', 'Backup deleted');
                loadBackupData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete backup');
            }
          },
        },
      ]);
    },
    [loadBackupData]
  );

  const handleRestoreBackup = useCallback(async (backup: BackupFile) => {
    Alert.alert(
      'Restore Backup',
      'This will overwrite your current documents and signatures. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              let pwd: string | undefined;

              if (backup.encrypted) {
                // Would need password input modal here
                Alert.alert('Password Required', 'This backup is password-protected');
                return;
              }

              const success = await BackupService.restoreFromLocalBackup(
                backup.fileUri,
                pwd
              );
              if (success) {
                Alert.alert('Success', 'Backup restored successfully');
                loadBackupData();
              } else {
                Alert.alert('Error', 'Failed to restore backup');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [loadBackupData]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderColor: colors.ui.border }]}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Backup & Export
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { borderBottomColor: colors.primary.blue },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? colors.primary.blue : colors.text.tertiary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === tab.id ? colors.primary.blue : colors.text.tertiary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.blue} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Processing...
            </Text>
          </View>
        )}

        {!loading && activeTab === 'backup' && (
          <>
            {/* Backup Status */}
            <View style={[styles.statusBox, { backgroundColor: colors.background.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Backup Status
              </Text>

              <BackupInfoCard
                title="Last Backup"
                value={formatDate(lastBackupTime)}
                icon="cloud-done-outline"
                colors={colors}
              />

              <BackupInfoCard
                title="Next Backup"
                value={
                  daysUntilBackup < 0
                    ? 'Not scheduled'
                    : daysUntilBackup === 0
                      ? 'Today'
                      : `In ${daysUntilBackup} days`
                }
                icon="calendar-outline"
                colors={colors}
              />

              <BackupInfoCard
                title="Total Backups"
                value={`${backups.length + cloudBackups.length} backups`}
                icon="folder-outline"
                colors={colors}
              />
            </View>

            {/* Auto-Backup Toggle */}
            <View style={[styles.settingBox, { backgroundColor: colors.background.card }]}>
              <View style={styles.settingRow}>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                    Auto Backup
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                    Monthly automatic backups to cloud
                  </Text>
                </View>
                <Switch
                  value={autoBackupEnabled}
                  onValueChange={handleToggleAutoBackup}
                  trackColor={{ false: colors.ui.border, true: colors.primary.blue + '60' }}
                  thumbColor={autoBackupEnabled ? colors.primary.blue : colors.text.tertiary}
                />
              </View>
            </View>

            {/* Create Backup Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary.blue }]}
              onPress={handleCreateBackup}
              disabled={loading}
            >
              <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Create Backup Now</Text>
            </TouchableOpacity>
          </>
        )}

        {!loading && activeTab === 'export' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Export Documents
            </Text>

            <View style={[styles.infoBox, { backgroundColor: colors.background.card }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary.blue} />
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Export all documents, signatures, and acceptance history as a portable ZIP file
              </Text>
            </View>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary.blue }]}>
              <Ionicons name="download" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Export as ZIP</Text>
            </TouchableOpacity>
          </>
        )}

        {!loading && activeTab === 'restore' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Restore Backup
            </Text>

            {backups.length > 0 ? (
              <>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                  Local Backups
                </Text>
                {backups.map((backup) => (
                  <BackupCard
                    key={backup.id}
                    backup={backup}
                    onRestore={() => handleRestoreBackup(backup)}
                    onDelete={() => handleDeleteBackup(backup.id)}
                    colors={colors}
                  />
                ))}
              </>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.background.card }]}>
                <Ionicons name="folder-open-outline" size={48} color={colors.text.tertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
                  No Backups
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
                  Create a backup first
                </Text>
              </View>
            )}
          </>
        )}

        {!loading && activeTab === 'history' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Backup History
            </Text>

            {(backups.length > 0 || cloudBackups.length > 0) ? (
              <>
                {cloudBackups.length > 0 && (
                  <>
                    <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                      Cloud Backups
                    </Text>
                    {cloudBackups.map((backup) => (
                      <BackupCard
                        key={backup.cloudId}
                        backup={backup}
                        onRestore={() => handleRestoreBackup(backup)}
                        onDelete={() => handleDeleteBackup(backup.id)}
                        colors={colors}
                      />
                    ))}
                  </>
                )}

                {backups.length > 0 && (
                  <>
                    <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                      Local Backups
                    </Text>
                    {backups.map((backup) => (
                      <BackupCard
                        key={backup.id}
                        backup={backup}
                        onRestore={() => handleRestoreBackup(backup)}
                        onDelete={() => handleDeleteBackup(backup.id)}
                        colors={colors}
                      />
                    ))}
                  </>
                )}
              </>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.background.card }]}>
                <Ionicons name="time-outline" size={48} color={colors.text.tertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
                  No History
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
                  Backups will appear here
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
          <View style={[styles.modalHeader, { borderColor: colors.ui.border }]}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Set Password
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            <Text style={[styles.modalLabel, { color: colors.text.primary }]}>
              Create a password to protect this backup:
            </Text>

            <TextInput
              style={[
                styles.passwordInput,
                {
                  color: colors.text.primary,
                  borderColor: colors.ui.border,
                  backgroundColor: colors.background.primary,
                },
              ]}
              placeholder="Password (min 6 chars)"
              placeholderTextColor={colors.text.tertiary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={[
                styles.passwordInput,
                {
                  color: colors.text.primary,
                  borderColor: colors.ui.border,
                  backgroundColor: colors.background.primary,
                },
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.text.tertiary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary.blue }]}
              onPress={handlePasswordBackup}
              disabled={loading || password.length < 6}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Create Protected Backup</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  tabScroll: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  tabContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.caption,
    fontWeight: '600',
    marginVertical: Spacing.md,
  },
  statusBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  settingBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.caption,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  infoLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  infoValue: {
    ...Typography.body,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  infoText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    ...Typography.body,
    fontWeight: '700',
  },
  backupCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backupIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupTime: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  backupSize: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  verifiedText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...Typography.caption,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  modalLabel: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    marginBottom: Spacing.md,
  },
});
