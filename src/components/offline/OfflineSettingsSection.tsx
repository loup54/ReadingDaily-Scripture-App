/**
 * Offline Settings Section Component
 * Manages offline feature configuration with toggles, dropdowns, and actions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { StorageProgressBar } from '@/components/offline/StorageProgressBar';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { OfflineDownloadCoordinator } from '@/services/offline/OfflineDownloadCoordinator';
import { StorageCleanupService } from '@/services/offline/StorageCleanupService';
import { ToastService } from '@/services/notifications/ToastService';

interface OfflineSettingsSectionProps {
  onStorageRefresh?: () => Promise<void>;
  isDark?: boolean;
  colors?: any;
}

/**
 * Offline Settings Section Component
 */
export const OfflineSettingsSection: React.FC<OfflineSettingsSectionProps> = ({
  onStorageRefresh,
  isDark: propIsDark,
  colors: propColors,
}) => {
  const isDark = propIsDark ?? useColorScheme() === 'dark';
  const { cachedReadingDates, storageStats, isDownloading } = useOfflineStore();
  const { settings, updateOfflineSettings } = useSettingsStore();
  const [isDownloadingNow, setIsDownloadingNow] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const offlineSettings = settings?.offline || {};

  // Color scheme
  const colors = propColors || {
    text: { primary: isDark ? Colors.text.white : Colors.text.primary },
    secondary: isDark ? Colors.text.secondary : Colors.text.secondary,
    background: { card: isDark ? '#1A1A1A' : Colors.background.card },
    ui: { divider: isDark ? '#333' : Colors.ui.divider },
  };

  /**
   * Handle auto-download toggle
   */
  const handleAutoDownloadToggle = useCallback(async (value: boolean) => {
    try {
      await updateOfflineSettings({ autoDownloadEnabled: value });
      console.log('[OfflineSettings] Auto-download toggled:', value);
      ToastService.showInfo('Setting Updated', value ? 'Auto-download enabled' : 'Auto-download disabled');
    } catch (error) {
      console.error('[OfflineSettings] Failed to toggle auto-download:', error);
      ToastService.showError('Update Failed', 'Could not update auto-download setting');
    }
  }, [updateOfflineSettings]);

  /**
   * Handle WiFi-only toggle
   */
  const handleWiFiOnlyToggle = useCallback(async (value: boolean) => {
    try {
      await updateOfflineSettings({ wifiOnlyEnabled: value });
      console.log('[OfflineSettings] WiFi-only toggled:', value);
      ToastService.showInfo('Setting Updated', value ? 'WiFi-only enabled' : 'WiFi-only disabled');
    } catch (error) {
      console.error('[OfflineSettings] Failed to toggle WiFi-only:', error);
      ToastService.showError('Update Failed', 'Could not update WiFi setting');
    }
  }, [updateOfflineSettings]);

  /**
   * Handle days to download change
   */
  const handleDaysChange = useCallback(async (value: number) => {
    try {
      await updateOfflineSettings({ daysToDownload: value });
      console.log('[OfflineSettings] Days to download changed:', value);
      ToastService.showInfo('Setting Updated', `Cache will include ${value} days of readings`);
    } catch (error) {
      console.error('[OfflineSettings] Failed to change days:', error);
      ToastService.showError('Update Failed', 'Could not update days setting');
    }
  }, [updateOfflineSettings]);

  /**
   * Handle download now
   */
  const handleDownloadNow = useCallback(async () => {
    try {
      setIsDownloadingNow(true);
      ToastService.showDownloadStarted('Offline content');

      const config = {
        autoDownloadEnabled: true,
        wifiOnlyEnabled: false,
        selectedLanguages: offlineSettings.selectedLanguagesForCache || ['es'],
        audioVoicePreference: offlineSettings.audioVoiceForDownload || 'FEMALE_PRIMARY',
        audioSpeedPreference: offlineSettings.audioSpeedForDownload || 1.0,
        daysToDownload: offlineSettings.daysToDownload || 7,
      };

      await OfflineDownloadCoordinator.startCoordinatedDownload(config);

      const cachedDates = await OfflineDownloadCoordinator.getDownloadedDates?.() || [];
      ToastService.showDownloadComplete(cachedDates.length || 7);

      console.log('[OfflineSettings] Download completed successfully');

      // Refresh storage stats if callback provided
      if (onStorageRefresh) {
        await onStorageRefresh();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[OfflineSettings] Download failed:', error);
      ToastService.showDownloadFailed(errorMsg, true, () => handleDownloadNow());
    } finally {
      setIsDownloadingNow(false);
    }
  }, [offlineSettings, onStorageRefresh]);

  /**
   * Handle clear all cache with confirmation
   */
  const handleClearAll = useCallback(async () => {
    const storageSize = storageStats?.used
      ? `${(storageStats.used / 1024 / 1024).toFixed(1)} MB`
      : 'unknown amount of';

    Alert.alert(
      'Clear All Offline Data',
      `This will delete ${storageSize} of cached readings, audio, and translations. This cannot be undone.`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('[OfflineSettings] Clear cancelled'),
          style: 'cancel',
        },
        {
          text: 'Clear All',
          onPress: async () => {
            try {
              setIsClearing(true);
              ToastService.showInfo('Clearing', 'Removing offline data...');

              await StorageCleanupService.clearAllOfflineData();

              ToastService.showSuccess('Cleared', 'All offline data removed');
              console.log('[OfflineSettings] All data cleared');

              // Refresh storage stats
              if (onStorageRefresh) {
                await onStorageRefresh();
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              console.error('[OfflineSettings] Clear failed:', error);
              ToastService.showError('Clear Failed', errorMsg);
            } finally {
              setIsClearing(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  }, [storageStats, onStorageRefresh]);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: Colors.text.white }]}>
        Offline Settings
      </Text>

      <View style={[styles.card, { backgroundColor: colors.background.card }]}>
        {/* Storage Progress Bar */}
        {storageStats && (
          <View style={styles.storageContainer}>
            <StorageProgressBar
              usedBytes={storageStats.used || 0}
              totalBytes={storageStats.total || 52428800} // 50MB default
              maxBytes={52428800} // 50MB max
              showWarning={true}
              warningThreshold={80}
              criticalThreshold={90}
            />
          </View>
        )}

        {/* Cached Readings Info */}
        <View style={[styles.infoRow, { borderBottomColor: colors.ui.divider }]}>
          <View style={styles.infoLeft}>
            <Ionicons name="archive-outline" size={20} color={Colors.primary.blue} />
            <Text style={[styles.infoLabel, { color: colors.text.primary }]}>
              Cached Readings
            </Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.secondary }]}>
            {cachedReadingDates?.length || 0} days
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.ui.divider }]} />

        {/* Auto-Download Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="download-outline" size={22} color={Colors.primary.blue} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                Auto-Download
              </Text>
              <Text style={[styles.settingDescription, { color: colors.secondary }]}>
                Download readings automatically
              </Text>
            </View>
          </View>
          <Switch
            value={offlineSettings.autoDownloadEnabled ?? true}
            onValueChange={handleAutoDownloadToggle}
            trackColor={{ false: colors.ui.divider, true: Colors.primary.blue }}
            thumbColor={Colors.text.white}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.ui.divider }]} />

        {/* WiFi-Only Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="wifi-outline" size={22} color={Colors.primary.blue} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                WiFi Only
              </Text>
              <Text style={[styles.settingDescription, { color: colors.secondary }]}>
                Download only on WiFi networks
              </Text>
            </View>
          </View>
          <Switch
            value={offlineSettings.wifiOnlyEnabled ?? false}
            onValueChange={handleWiFiOnlyToggle}
            trackColor={{ false: colors.ui.divider, true: Colors.primary.blue }}
            thumbColor={Colors.text.white}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.ui.divider }]} />

        {/* Days to Download */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="calendar-outline" size={22} color={Colors.primary.blue} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                Cache Duration
              </Text>
              <Text style={[styles.settingDescription, { color: colors.secondary }]}>
                Days of readings to keep
              </Text>
            </View>
          </View>
          <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
            <Picker
              selectedValue={offlineSettings.daysToDownload ?? 7}
              onValueChange={handleDaysChange}
              style={{ width: 60, height: 32 }}
              itemStyle={{ color: colors.text.primary, fontSize: 14 }}
            >
              <Picker.Item label="3" value={3} />
              <Picker.Item label="7" value={7} />
              <Picker.Item label="14" value={14} />
              <Picker.Item label="30" value={30} />
            </Picker>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.ui.divider }]} />

        {/* Download Now Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: Colors.primary.blue,
              opacity: isDownloadingNow || isDownloading ? 0.6 : 1,
            },
          ]}
          onPress={handleDownloadNow}
          disabled={isDownloadingNow || isDownloading}
          activeOpacity={0.7}
        >
          {isDownloadingNow || isDownloading ? (
            <>
              <ActivityIndicator size="small" color={Colors.text.white} style={{ marginRight: Spacing.sm }} />
              <Text style={styles.actionButtonText}>Downloading...</Text>
            </>
          ) : (
            <>
              <Ionicons name="download" size={18} color={Colors.text.white} style={{ marginRight: Spacing.xs }} />
              <Text style={styles.actionButtonText}>Download Now</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.ui.divider }]} />

        {/* Clear All Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: Colors.status.error,
              opacity: isClearing ? 0.6 : 1,
            },
          ]}
          onPress={handleClearAll}
          disabled={isClearing}
          activeOpacity={0.7}
        >
          {isClearing ? (
            <>
              <ActivityIndicator size="small" color={Colors.text.white} style={{ marginRight: Spacing.sm }} />
              <Text style={styles.actionButtonText}>Clearing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="trash" size={18} color={Colors.text.white} style={{ marginRight: Spacing.xs }} />
              <Text style={styles.actionButtonText}>Clear All Offline Data</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.label,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  storageContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: Colors.primary.blue,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  actionButtonText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
