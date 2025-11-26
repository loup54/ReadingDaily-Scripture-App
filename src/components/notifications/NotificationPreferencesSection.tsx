/**
 * Notification Preferences Section
 * Phase 10B.6: Settings Integration
 *
 * Reusable section component for displaying notification preference toggles
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  SwitchProps,
} from 'react-native';
import { NotificationPreferences } from '@/types/notifications.types';

/**
 * Individual preference item props
 */
interface PreferenceItemProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: string;
}

/**
 * Preference item component
 */
function PreferenceItem({
  label,
  description,
  value,
  onChange,
  icon,
}: PreferenceItemProps) {
  return (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceContent}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E0E0E0', true: '#81C784' }}
        thumbColor={value ? '#4CAF50' : '#f4f3f4'}
      />
    </View>
  );
}

/**
 * Notification Preferences Section Props
 */
interface NotificationPreferencesSectionProps {
  preferences: Partial<NotificationPreferences>;
  onPreferenceChange: (field: string, value: boolean) => void;
  title?: string;
  description?: string;
  showChannels?: boolean;
  showTypes?: boolean;
  showSound?: boolean;
}

/**
 * Notification Preferences Section Component
 */
export function NotificationPreferencesSection({
  preferences,
  onPreferenceChange,
  title = 'Notification Preferences',
  description = 'Customize your notification settings',
  showChannels = true,
  showTypes = true,
  showSound = true,
}: NotificationPreferencesSectionProps) {
  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.subtitle}>{description}</Text>}
      </View>

      {/* Channel Preferences */}
      {showChannels && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Notification Channels</Text>

          <PreferenceItem
            label="Push Notifications"
            description="Receive notifications on your device"
            value={preferences.pushNotificationsEnabled ?? true}
            onChange={(value) =>
              onPreferenceChange('pushNotificationsEnabled', value)
            }
            icon="📱"
          />

          <PreferenceItem
            label="In-App Notifications"
            description="Toast notifications while using the app"
            value={preferences.inAppNotificationsEnabled ?? true}
            onChange={(value) =>
              onPreferenceChange('inAppNotificationsEnabled', value)
            }
            icon="📬"
          />

          <PreferenceItem
            label="Email Notifications"
            description="Receive email summaries"
            value={preferences.emailNotificationsEnabled ?? false}
            onChange={(value) =>
              onPreferenceChange('emailNotificationsEnabled', value)
            }
            icon="📧"
          />
        </View>
      )}

      {/* Type Preferences */}
      {showTypes && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Notification Types</Text>

          <PreferenceItem
            label="Daily Reminders"
            description="Remind me to read scripture daily"
            value={preferences.dailyRemindersEnabled ?? true}
            onChange={(value) =>
              onPreferenceChange('dailyRemindersEnabled', value)
            }
            icon="🔔"
          />

          <PreferenceItem
            label="Achievements"
            description="Celebrate milestones and unlocked achievements"
            value={preferences.achievementNotificationsEnabled ?? true}
            onChange={(value) =>
              onPreferenceChange('achievementNotificationsEnabled', value)
            }
            icon="🏆"
          />

          <PreferenceItem
            label="Performance Insights"
            description="Weekly stats and reading progress analysis"
            value={preferences.performanceInsightNotificationsEnabled ?? true}
            onChange={(value) =>
              onPreferenceChange('performanceInsightNotificationsEnabled', value)
            }
            icon="📊"
          />
        </View>
      )}

      {/* Sound Preference */}
      {showSound && (
        <View style={styles.subsection}>
          <PreferenceItem
            label="Notification Sound"
            description="Play sound for notifications"
            value={preferences.notificationSoundEnabled ?? true}
            onChange={(value) =>
              onPreferenceChange('notificationSoundEnabled', value)
            }
            icon="🔊"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  subsection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  preferenceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  description: {
    fontSize: 11,
    color: '#999',
    lineHeight: 14,
  },
});
