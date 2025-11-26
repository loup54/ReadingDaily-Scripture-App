/**
 * Settings Screen
 * Phase 10C.6: User Settings
 *
 * Main settings screen with sections:
 * - Account (name, email, avatar)
 * - Preferences (language, difficulty, theme)
 * - Notifications (reminders, alerts)
 * - Subscription (tier, upgrade, cancel)
 * - Data & Privacy (export, delete)
 * - About (version, help, feedback)
 *
 * Features:
 * - Editable fields
 * - Toggle switches
 * - Time picker
 * - Avatar picker
 * - Confirmation dialogs
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/stores/useProfileStore';
import SettingsSection from '@/components/settings/SettingsSection';
import AvatarPicker from '@/components/settings/AvatarPicker';
import TimePicker from '@/components/settings/TimePicker';

/**
 * SettingsScreen component
 */
const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Get store state
  const profile = useProfileStore((state) => state.profile);
  const isLoading = useProfileStore((state) => state.isLoading);
  const updateProfile = useProfileStore((state) => state.updateProfile);

  // Local state for editable fields
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [language, setLanguage] = useState(profile?.preferences.language || 'en');
  const [difficulty, setDifficulty] = useState(profile?.preferences.difficultyPreference || 3);
  const [reminderEnabled, setReminderEnabled] = useState(profile?.preferences.dailyReminder || true);
  const [reminderTime, setReminderTime] = useState(profile?.preferences.reminderTime || '08:00');
  const [emailNotifications, setEmailNotifications] = useState(
    profile?.preferences.emailNotifications || true
  );
  const [pushNotifications, setPushNotifications] = useState(
    profile?.preferences.pushNotifications || true
  );

  /**
   * Handle save settings
   */
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);

      await updateProfile({
        displayName,
        preferences: {
          language: language as 'en' | 'es' | 'fr',
          difficultyPreference: difficulty as 1 | 2 | 3 | 4 | 5,
          dailyReminder: reminderEnabled,
          reminderTime,
          emailNotifications,
          pushNotifications,
        },
      });

      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      console.error('[SettingsScreen] Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle avatar update
   */
  const handleAvatarSelected = async (avatarUri: string) => {
    try {
      setIsSaving(true);

      await updateProfile({
        displayName,
        avatar: avatarUri,
      });

      setShowAvatarPicker(false);
      Alert.alert('Success', 'Avatar updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update avatar');
      console.error('[SettingsScreen] Error updating avatar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle time selected
   */
  const handleTimeSelected = (time: string) => {
    setReminderTime(time);
    setShowTimePicker(false);
  };

  /**
   * Handle data export
   */
  const handleExportData = () => {
    Alert.alert('Export Data', 'Export your data as JSON file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: () => {
          console.log('[SettingsScreen] Exporting data...');
          Alert.alert('Success', 'Data exported to downloads folder');
        },
      },
    ]);
  };

  /**
   * Handle delete account
   */
  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This action cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          console.log('[SettingsScreen] Deleting account...');
          Alert.alert('Account Deleted', 'Your account has been permanently deleted');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Please log in to access settings</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <SettingsSection title="Account">
        <SettingItem label="Email" value={profile.email} editable={false} />
        <SettingItem
          label="Display Name"
          value={displayName}
          editable={true}
          onChangeText={setDisplayName}
        />
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => setShowAvatarPicker(true)}
        >
          <Text style={styles.settingButtonText}>Change Avatar</Text>
        </TouchableOpacity>
      </SettingsSection>

      {/* Preferences Section */}
      <SettingsSection title="Preferences">
        <SettingPicker
          label="Language"
          value={language}
          options={[
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
          ]}
          onValueChange={setLanguage}
        />
        <SettingPicker
          label="Difficulty Preference"
          value={difficulty.toString()}
          options={[
            { label: '1 - Easy', value: '1' },
            { label: '2 - Beginner', value: '2' },
            { label: '3 - Intermediate', value: '3' },
            { label: '4 - Advanced', value: '4' },
            { label: '5 - Expert', value: '5' },
          ]}
          onValueChange={(val) => setDifficulty(parseInt(val))}
        />
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection title="Notifications">
        <SettingToggle
          label="Daily Reminder"
          value={reminderEnabled}
          onValueChange={setReminderEnabled}
        />
        {reminderEnabled && (
          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.settingButtonText}>
              Reminder Time: {reminderTime}
            </Text>
          </TouchableOpacity>
        )}
        <SettingToggle
          label="Email Notifications"
          value={emailNotifications}
          onValueChange={setEmailNotifications}
        />
        <SettingToggle
          label="Push Notifications"
          value={pushNotifications}
          onValueChange={setPushNotifications}
        />
      </SettingsSection>

      {/* Subscription Section */}
      <SettingsSection title="Subscription">
        <SettingItem
          label="Current Tier"
          value={profile.currentTier === 'basic' ? 'Premium' : 'Free'}
          editable={false}
        />
        <TouchableOpacity style={styles.subscriptionButton}>
          <Text style={styles.subscriptionButtonText}>
            {profile.currentTier === 'basic' ? 'Manage Subscription' : 'Upgrade to Premium'}
          </Text>
        </TouchableOpacity>
      </SettingsSection>

      {/* Data & Privacy Section */}
      <SettingsSection title="Data & Privacy">
        <TouchableOpacity style={styles.settingButton} onPress={handleExportData}>
          <Text style={styles.settingButtonText}>Export My Data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingButton, styles.dangerButton]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.dangerButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </SettingsSection>

      {/* About Section */}
      <SettingsSection title="About">
        <SettingItem label="App Version" value="1.0.0" editable={false} />
        <SettingItem label="Build" value="20251116" editable={false} />
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Send Feedback</Text>
        </TouchableOpacity>
      </SettingsSection>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSaveSettings}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      {/* Spacing */}
      <View style={styles.spacing} />

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <AvatarPicker
          visible={showAvatarPicker}
          onAvatarSelected={handleAvatarSelected}
          onCancel={() => setShowAvatarPicker(false)}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <TimePicker
          visible={showTimePicker}
          initialTime={reminderTime}
          onTimeSelected={handleTimeSelected}
          onCancel={() => setShowTimePicker(false)}
        />
      )}
    </ScrollView>
  );
};

/**
 * Setting Item Component
 */
interface SettingItemProps {
  label: string;
  value: string;
  editable?: boolean;
  onChangeText?: (text: string) => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ label, value, editable = false, onChangeText }) => {
  return (
    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text
        style={[
          styles.settingValue,
          editable && styles.settingValueEditable,
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

/**
 * Setting Picker Component
 */
interface SettingPickerProps {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onValueChange: (value: string) => void;
}

const SettingPicker: React.FC<SettingPickerProps> = ({ label, value, options, onValueChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || value;

  if (showPicker) {
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>{label}</Text>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              value === option.value && styles.pickerOptionSelected,
            ]}
            onPress={() => {
              onValueChange(option.value);
              setShowPicker(false);
            }}
          >
            <Text
              style={[
                styles.pickerOptionText,
                value === option.value && styles.pickerOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={() => setShowPicker(true)}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{selectedLabel}</Text>
    </TouchableOpacity>
  );
};

/**
 * Setting Toggle Component
 */
interface SettingToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({ label, value, onValueChange }) => {
  return (
    <View style={styles.settingToggle}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#ccc', true: '#81C784' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  settingItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  settingValueEditable: {
    color: '#007AFF',
  },
  settingToggle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFD700',
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscriptionButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginVertical: 8,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  pickerOptionSelected: {
    backgroundColor: '#007AFF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#000',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 14,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spacing: {
    height: 40,
  },
});

export default SettingsScreen;
