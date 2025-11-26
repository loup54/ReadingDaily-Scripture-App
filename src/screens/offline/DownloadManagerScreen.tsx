/**
 * Download Manager Screen
 * Manages offline content downloads with date range, preferences, and history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { ProgressIndicator } from '@/components/common/ProgressIndicator';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { OfflineDownloadCoordinator } from '@/services/offline/OfflineDownloadCoordinator';
import { StorageCleanupService } from '@/services/offline/StorageCleanupService';
import { ToastService } from '@/services/notifications/ToastService';
import { DateRangePicker } from '@/components/offline/DateRangePicker';

interface DownloadManagerScreenProps {
  onBack?: () => void;
  onDownloadStart?: () => void;
}

// Download history item
interface DownloadHistoryItem {
  id: string;
  date: number;
  startDate: string;
  endDate: string;
  daysCount: number;
  size: number;
  status: 'completed' | 'failed' | 'cancelled';
  itemsDownloaded: number;
  duration: number; // milliseconds
}

/**
 * Format bytes to human-readable size
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date for display
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Estimate download size based on days
 */
const estimateDownloadSize = (days: number): number => {
  // Rough estimates: Each day ~100KB for readings + 500KB for audio = ~600KB per day
  const sizePerDay = 600 * 1024; // 600KB
  return days * sizePerDay;
};

/**
 * Download Manager Screen
 */
export const DownloadManagerScreen: React.FC<DownloadManagerScreenProps> = ({
  onBack,
  onDownloadStart,
}) => {
  const { colors } = useTheme();
  const { isDownloading, downloadProgress } = useOfflineStore();
  const { settings, updateOfflineSettings } = useSettingsStore();
  const isDark = useColorScheme() === 'dark';

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to last 7 days
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [wifiOnly, setWifiOnly] = useState(settings?.offline?.wifiOnlyEnabled ?? false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    settings?.offline?.selectedLanguagesForCache?.[0] ?? 'es'
  );
  const [voiceType, setVoiceType] = useState(settings?.offline?.audioVoiceForDownload ?? 'FEMALE_PRIMARY');
  const [speed, setSpeed] = useState(settings?.offline?.audioSpeedForDownload ?? 1.0);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load download history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        // In a real app, this would come from AsyncStorage
        // For now, we'll initialize with empty history
        setDownloadHistory([]);
      } catch (error) {
        console.error('[DownloadManager] Failed to load history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  // Calculate estimated size
  const daysInRange = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const estimatedSize = estimateDownloadSize(daysInRange);

  /**
   * Save preferences to store
   */
  const savePreferences = useCallback(async () => {
    try {
      await updateOfflineSettings({
        wifiOnlyEnabled: wifiOnly,
        selectedLanguagesForCache: [selectedLanguage],
        audioVoiceForDownload: voiceType,
        audioSpeedForDownload: speed,
      });
      console.log('[DownloadManager] Preferences saved');
    } catch (error) {
      console.error('[DownloadManager] Failed to save preferences:', error);
    }
  }, [wifiOnly, selectedLanguage, voiceType, speed, updateOfflineSettings]);

  /**
   * Handle start download
   */
  const handleStartDownload = useCallback(async () => {
    try {
      // Save preferences first
      await savePreferences();

      console.log('[DownloadManager] Starting download for range:', {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        days: daysInRange,
        estimatedSize: formatBytes(estimatedSize),
      });

      ToastService.showDownloadStarted(`${daysInRange} days of readings`);

      const config = {
        autoDownloadEnabled: true,
        wifiOnlyEnabled: wifiOnly,
        selectedLanguages: [selectedLanguage],
        audioVoicePreference: voiceType,
        audioSpeedPreference: speed,
        daysToDownload: daysInRange,
      };

      // Start download
      await OfflineDownloadCoordinator.startCoordinatedDownload(config);

      // Add to history
      const historyItem: DownloadHistoryItem = {
        id: `download_${Date.now()}`,
        date: Date.now(),
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        daysCount: daysInRange,
        size: estimatedSize,
        status: 'completed',
        itemsDownloaded: daysInRange,
        duration: 0, // Would be calculated in real app
      };

      setDownloadHistory((prev) => [historyItem, ...prev]);
      ToastService.showDownloadComplete(daysInRange);

      console.log('[DownloadManager] Download completed');

      if (onDownloadStart) {
        onDownloadStart();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DownloadManager] Download failed:', error);
      ToastService.showDownloadFailed(errorMsg, true, handleStartDownload);
    }
  }, [startDate, endDate, daysInRange, estimatedSize, wifiOnly, selectedLanguage, voiceType, speed, savePreferences, onDownloadStart]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <LinearGradient
        colors={[colors.primary.blue, colors.primary.blue]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.text.white} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text.white }]}>
            Download Manager
          </Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Date Range Section */}
          <View style={[styles.section, { backgroundColor: colors.background.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Select Date Range
            </Text>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </View>

          {/* Size Estimation Section */}
          <View style={[styles.estimationCard, { backgroundColor: colors.background.card }]}>
            <View style={styles.estimationHeader}>
              <Ionicons name="download-outline" size={24} color={colors.primary.blue} />
              <View style={styles.estimationText}>
                <Text style={[styles.estimationLabel, { color: colors.text.secondary }]}>
                  Estimated Download Size
                </Text>
                <Text style={[styles.estimationValue, { color: colors.text.primary }]}>
                  {formatBytes(estimatedSize)}
                </Text>
              </View>
            </View>

            <View style={[styles.estimationDetails, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                  Days to Download
                </Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                  {daysInRange} day{daysInRange !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                  Avg. per day
                </Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                  {formatBytes(estimateDownloadSize(1))}
                </Text>
              </View>
            </View>
          </View>

          {/* Download Preferences Section */}
          <View style={[styles.section, { backgroundColor: colors.background.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Download Preferences
            </Text>

            {/* Language Selection */}
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="language-outline" size={20} color={colors.primary.blue} />
                <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>
                  Language
                </Text>
              </View>
              <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
                <Picker
                  selectedValue={selectedLanguage}
                  onValueChange={setSelectedLanguage}
                  style={{ width: 100, height: 32 }}
                  itemStyle={{ color: colors.text.primary, fontSize: 14 }}
                >
                  <Picker.Item label="Spanish" value="es" />
                  <Picker.Item label="French" value="fr" />
                  <Picker.Item label="Portuguese" value="pt" />
                </Picker>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.ui.divider }]} />

            {/* Voice Type Selection */}
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="volume-high-outline" size={20} color={colors.primary.blue} />
                <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>
                  Voice
                </Text>
              </View>
              <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
                <Picker
                  selectedValue={voiceType}
                  onValueChange={setVoiceType}
                  style={{ width: 120, height: 32 }}
                  itemStyle={{ color: colors.text.primary, fontSize: 14 }}
                >
                  <Picker.Item label="Female Primary" value="FEMALE_PRIMARY" />
                  <Picker.Item label="Male Primary" value="MALE_PRIMARY" />
                  <Picker.Item label="Female Secondary" value="FEMALE_SECONDARY" />
                </Picker>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.ui.divider }]} />

            {/* Speed Selection */}
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="speedometer-outline" size={20} color={colors.primary.blue} />
                <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>
                  Speed
                </Text>
              </View>
              <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
                <Picker
                  selectedValue={speed}
                  onValueChange={setSpeed}
                  style={{ width: 80, height: 32 }}
                  itemStyle={{ color: colors.text.primary, fontSize: 14 }}
                >
                  <Picker.Item label="0.8x" value={0.8} />
                  <Picker.Item label="1.0x" value={1.0} />
                  <Picker.Item label="1.2x" value={1.2} />
                  <Picker.Item label="1.5x" value={1.5} />
                </Picker>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.ui.divider }]} />

            {/* WiFi Only Toggle */}
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="wifi-outline" size={20} color={colors.primary.blue} />
                <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>
                  WiFi Only
                </Text>
              </View>
              <Switch
                value={wifiOnly}
                onValueChange={setWifiOnly}
                trackColor={{ false: colors.ui.divider, true: colors.primary.blue }}
                thumbColor={Colors.text.white}
              />
            </View>
          </View>

          {/* Download Progress or Start Button */}
          {isDownloading ? (
            <View style={[styles.progressSection, { backgroundColor: colors.background.card }]}>
              <ProgressIndicator
                percentage={downloadProgress.percentage}
                message={`Downloading ${downloadProgress.step}`}
                current={downloadProgress.itemsCompleted}
                total={downloadProgress.itemsTotal}
                showETA={true}
                elapsedTime={downloadProgress.elapsedMs}
                showSpeed={true}
              />
              {downloadProgress.currentItem && (
                <Text style={[styles.currentItemText, { color: colors.text.secondary }]}>
                  Current: {downloadProgress.currentItem}
                </Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: colors.primary.blue }]}
              onPress={handleStartDownload}
              disabled={isDownloading}
              activeOpacity={0.7}
            >
              <>
                <Ionicons name="download" size={18} color={Colors.text.white} style={{ marginRight: Spacing.sm }} />
                <Text style={styles.downloadButtonText}>
                  Start Download ({formatBytes(estimatedSize)})
                </Text>
              </>
            </TouchableOpacity>
          )}

          {/* Download History Section */}
          {!isLoadingHistory && downloadHistory.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.background.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Download History
              </Text>

              {downloadHistory.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.historyItem}>
                    <View style={styles.historyIcon}>
                      <Ionicons
                        name={
                          item.status === 'completed'
                            ? 'checkmark-circle'
                            : item.status === 'failed'
                            ? 'close-circle'
                            : 'ban'
                        }
                        size={20}
                        color={
                          item.status === 'completed'
                            ? Colors.status.success
                            : Colors.status.error
                        }
                      />
                    </View>

                    <View style={styles.historyContent}>
                      <Text style={[styles.historyDate, { color: colors.text.primary }]}>
                        {item.startDate} - {item.endDate}
                      </Text>
                      <Text style={[styles.historyDetails, { color: colors.text.secondary }]}>
                        {item.daysCount} day{item.daysCount !== 1 ? 's' : ''} • {formatBytes(item.size)} • {item.itemsDownloaded} items
                      </Text>
                    </View>

                    <View style={styles.historyStatus}>
                      <Text
                        style={[
                          styles.historyStatusText,
                          {
                            color:
                              item.status === 'completed'
                                ? Colors.status.success
                                : Colors.status.error,
                          },
                        ]}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  {index < downloadHistory.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.ui.divider }]} />
                  )}
                </View>
              ))}
            </View>
          )}

          {isLoadingHistory && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary.blue} />
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  estimationCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  estimationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  estimationText: {
    flex: 1,
  },
  estimationLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  estimationValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  estimationDetails: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.ui.divider,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  downloadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  downloadButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  historyIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyDetails: {
    fontSize: 12,
  },
  historyStatus: {
    alignItems: 'flex-end',
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  currentItemText: {
    fontSize: 12,
    marginTop: Spacing.md,
    fontWeight: '500',
    textAlign: 'center',
  },
});
