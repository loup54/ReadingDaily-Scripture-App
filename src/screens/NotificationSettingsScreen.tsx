/**
 * Notification Settings Screen
 * Phase 10B.6: Settings Integration
 *
 * Complete notification preferences management screen with all toggles,
 * time pickers, quiet hours, and notification channel configuration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingState } from '@/components/common/LoadingState';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useDailyReminder,
  useNotificationLoading,
  useNotificationError,
} from '@/stores/useNotificationStore';
import { useShowSuccessToast, useShowErrorToast } from '@/stores/useToastStore';
import { NotificationPreferencesSection } from '@/components/notifications/NotificationPreferencesSection';
import { DailyReminderPicker } from '@/components/notifications/DailyReminderPicker';
import { QuietHoursSettings } from '@/components/notifications/QuietHoursSettings';

/**
 * Notification Settings Screen
 */
export function NotificationSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userId = user?.uid || '';

  // Store hooks
  const preferences = useNotificationPreferences();
  const dailyReminder = useDailyReminder();
  const updatePreferences = useUpdateNotificationPreferences();
  const isLoading = useNotificationLoading();
  const errorMessage = useNotificationError();

  // Toast hooks
  const showSuccess = useShowSuccessToast();
  const showError = useShowErrorToast();

  // Local state for form
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Sync local state with store
   */
  useEffect(() => {
    setLocalPrefs(preferences);
    setHasChanges(false);
  }, [preferences]);

  /**
   * Handle preference toggle
   */
  const handleTogglePreference = (field: string, value: boolean) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  /**
   * Save preferences
   */
  const handleSavePreferences = async () => {
    if (!userId) {
      showError('User not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      await updatePreferences(userId, localPrefs);
      showSuccess('Notification preferences saved');
      setHasChanges(false);
    } catch (error) {
      showError('Failed to save preferences');
      console.error('[NotificationSettings] Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle reset to defaults
   */
  const handleResetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will restore default notification settings. Continue?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Reset',
          onPress: () => {
            const defaults = {
              ...localPrefs,
              pushNotificationsEnabled: true,
              inAppNotificationsEnabled: true,
              emailNotificationsEnabled: false,
              dailyRemindersEnabled: true,
              achievementNotificationsEnabled: true,
              performanceInsightNotificationsEnabled: true,
              quietHoursEnabled: false,
              notificationSoundEnabled: true,
            };
            setLocalPrefs(defaults);
            setHasChanges(true);
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingState
          message="Fetching notification settings..."
          icon="notifications"
          size="lg"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Error Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notification Settings</Text>
            <Text style={styles.headerSubtitle}>
              Customize when and how you receive notifications
            </Text>
          </View>
        </View>

        {/* Main Channels Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>
          <Text style={styles.sectionDescription}>
            Choose how you want to receive notifications
          </Text>

          {/* Push Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={localPrefs?.pushNotificationsEnabled ?? true}
              onValueChange={(value) =>
                handleTogglePreference('pushNotificationsEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={localPrefs?.pushNotificationsEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          {/* In-App Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>In-App Notifications</Text>
              <Text style={styles.settingDescription}>
                Toast notifications while using the app
              </Text>
            </View>
            <Switch
              value={localPrefs?.inAppNotificationsEnabled ?? true}
              onValueChange={(value) =>
                handleTogglePreference('inAppNotificationsEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={localPrefs?.inAppNotificationsEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          {/* Email Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive email summaries
              </Text>
            </View>
            <Switch
              value={localPrefs?.emailNotificationsEnabled ?? false}
              onValueChange={(value) =>
                handleTogglePreference('emailNotificationsEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={localPrefs?.emailNotificationsEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notification Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <Text style={styles.sectionDescription}>
            Choose which notifications to receive
          </Text>

          {/* Daily Reminders */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Daily Reminders</Text>
              <Text style={styles.settingDescription}>
                Remind me to read scripture daily
              </Text>
            </View>
            <Switch
              value={localPrefs?.dailyRemindersEnabled ?? true}
              onValueChange={(value) =>
                handleTogglePreference('dailyRemindersEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={localPrefs?.dailyRemindersEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          {/* Achievement Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Achievement Notifications</Text>
              <Text style={styles.settingDescription}>
                Celebrate milestones and unlocked achievements
              </Text>
            </View>
            <Switch
              value={localPrefs?.achievementNotificationsEnabled ?? true}
              onValueChange={(value) =>
                handleTogglePreference('achievementNotificationsEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={localPrefs?.achievementNotificationsEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          {/* Performance Insights */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Performance Insights</Text>
              <Text style={styles.settingDescription}>
                Weekly stats and reading progress analysis
              </Text>
            </View>
            <Switch
              value={localPrefs?.performanceInsightNotificationsEnabled ?? true}
              onValueChange={(value) =>
                handleTogglePreference('performanceInsightNotificationsEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={
                localPrefs?.performanceInsightNotificationsEnabled
                  ? '#4CAF50'
                  : '#f4f3f4'
              }
            />
          </View>
        </View>

        {/* Daily Reminder Picker */}
        {localPrefs?.dailyRemindersEnabled && (
          <DailyReminderPicker
            reminder={dailyReminder}
            onReminderChange={(reminder) => {
              setLocalPrefs((prev) => ({
                ...prev,
                reminderTime: reminder.time,
              }));
              setHasChanges(true);
            }}
          />
        )}

        {/* Quiet Hours Settings */}
        <QuietHoursSettings
          enabled={localPrefs?.quietHoursEnabled ?? false}
          startTime={localPrefs?.quietHoursStart || '22:00'}
          endTime={localPrefs?.quietHoursEnd || '08:00'}
          onToggle={(value) => handleTogglePreference('quietHoursEnabled', value)}
          onStartTimeChange={(time) => {
            setLocalPrefs((prev) => ({
              ...prev,
              quietHoursStart: time,
            }));
            setHasChanges(true);
          }}
          onEndTimeChange={(time) => {
            setLocalPrefs((prev) => ({
              ...prev,
              quietHoursEnd: time,
            }));
            setHasChanges(true);
          }}
        />

        {/* Notification Sound */}
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Notification Sound</Text>
              <Text style={styles.settingDescription}>
                Play sound for notifications
              </Text>
            </View>
            <Switch
              value={localPrefs?.notificationSoundEnabled ?? true}
              onValueChange={(value) =>
                handleTogglePreference('notificationSoundEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={localPrefs?.notificationSoundEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Save Button */}
          {hasChanges && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                isSaving && styles.buttonDisabled,
              ]}
              onPress={handleSavePreferences}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleResetDefaults}
          >
            <Text style={styles.buttonSecondaryText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>💡 Tip</Text>
          <Text style={styles.infoBoxText}>
            Use Quiet Hours to pause notifications during sleep or focused time.
            Notifications will resume at the end time.
          </Text>
        </View>

        {/* Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '500',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: 8,
    marginTop: 4,
  },
  header: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoBox: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 6,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 16,
  },
});

export default NotificationSettingsScreen;
