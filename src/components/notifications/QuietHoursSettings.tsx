/**
 * Quiet Hours Settings Component
 * Phase 10B.6: Settings Integration
 *
 * Configuration for quiet hours to pause notifications during specific times
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';

/**
 * Quiet Hours Settings Props
 */
interface QuietHoursSettingsProps {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  onToggle: (enabled: boolean) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

/**
 * Parse time string to hours and minutes
 */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

/**
 * Format time string (HH:MM)
 */
function formatTime(hour: number, minute: number): string {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Quiet Hours Settings Component
 */
export function QuietHoursSettings({
  enabled,
  startTime,
  endTime,
  onToggle,
  onStartTimeChange,
  onEndTimeChange,
}: QuietHoursSettingsProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartHour, setTempStartHour] = useState(parseTime(startTime).hour);
  const [tempStartMinute, setTempStartMinute] = useState(parseTime(startTime).minute);
  const [tempEndHour, setTempEndHour] = useState(parseTime(endTime).hour);
  const [tempEndMinute, setTempEndMinute] = useState(parseTime(endTime).minute);

  /**
   * Handle save start time
   */
  const handleSaveStartTime = () => {
    const time = formatTime(tempStartHour, tempStartMinute);
    onStartTimeChange(time);
    setShowStartPicker(false);
  };

  /**
   * Handle save end time
   */
  const handleSaveEndTime = () => {
    const time = formatTime(tempEndHour, tempEndMinute);
    onEndTimeChange(time);
    setShowEndPicker(false);
  };

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🌙 Quiet Hours</Text>
          <Text style={styles.subtitle}>
            Pause notifications during specific times
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#E0E0E0', true: '#81C784' }}
          thumbColor={enabled ? '#4CAF50' : '#f4f3f4'}
        />
      </View>

      {/* Content - Show only when enabled */}
      {enabled && (
        <>
          {/* Time Range Display */}
          <View style={styles.timeRangeContainer}>
            <Text style={styles.timeRangeLabel}>Active During</Text>
            <Text style={styles.timeRangeText}>
              {startTime} - {endTime}
            </Text>
          </View>

          {/* Time Settings */}
          <View style={styles.timeSettings}>
            {/* Start Time */}
            <View style={styles.timeSettingItem}>
              <View style={styles.timeSettingContent}>
                <Text style={styles.timeSettingLabel}>Start Time</Text>
                <Text style={styles.timeSettingValue}>{startTime}</Text>
                <Text style={styles.timeSettingDescription}>
                  Notifications paused starting
                </Text>
              </View>
              <TouchableOpacity
                style={styles.timeSettingButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.timeSettingButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* End Time */}
            <View style={styles.timeSettingItem}>
              <View style={styles.timeSettingContent}>
                <Text style={styles.timeSettingLabel}>End Time</Text>
                <Text style={styles.timeSettingValue}>{endTime}</Text>
                <Text style={styles.timeSettingDescription}>
                  Notifications resume at
                </Text>
              </View>
              <TouchableOpacity
                style={styles.timeSettingButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.timeSettingButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>💡 How It Works</Text>
            <Text style={styles.infoBoxText}>
              During quiet hours, all notifications will be silently queued and delivered when
              the period ends. No notifications will be shown until the end time is reached.
            </Text>
          </View>
        </>
      )}

      {/* Disabled State Info */}
      {!enabled && (
        <View style={styles.disabledInfo}>
          <Text style={styles.disabledInfoText}>
            Enable quiet hours to automatically pause notifications during specific times
          </Text>
        </View>
      )}

      {/* Start Time Picker Modal */}
      <Modal
        visible={showStartPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                <Text style={styles.modalHeaderButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Quiet Hours Start</Text>
              <TouchableOpacity onPress={handleSaveStartTime}>
                <Text style={[styles.modalHeaderButton, styles.modalHeaderButtonActive]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <ScrollView style={styles.timeColumnScroll} scrollEventThrottle={16}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.timeOption,
                        tempStartHour === i && styles.timeOptionSelected,
                      ]}
                      onPress={() => setTempStartHour(i)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          tempStartHour === i && styles.timeOptionTextSelected,
                        ]}
                      >
                        {String(i).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeSeparator}>
                <Text style={styles.timeSeparatorText}>:</Text>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Minute</Text>
                <ScrollView style={styles.timeColumnScroll} scrollEventThrottle={16}>
                  {Array.from({ length: 60 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.timeOption,
                        tempStartMinute === i && styles.timeOptionSelected,
                      ]}
                      onPress={() => setTempStartMinute(i)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          tempStartMinute === i && styles.timeOptionTextSelected,
                        ]}
                      >
                        {String(i).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={styles.timeDisplay}>
              {formatTime(tempStartHour, tempStartMinute)}
            </Text>
          </View>
        </View>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal
        visible={showEndPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                <Text style={styles.modalHeaderButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Quiet Hours End</Text>
              <TouchableOpacity onPress={handleSaveEndTime}>
                <Text style={[styles.modalHeaderButton, styles.modalHeaderButtonActive]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <ScrollView style={styles.timeColumnScroll} scrollEventThrottle={16}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.timeOption,
                        tempEndHour === i && styles.timeOptionSelected,
                      ]}
                      onPress={() => setTempEndHour(i)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          tempEndHour === i && styles.timeOptionTextSelected,
                        ]}
                      >
                        {String(i).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeSeparator}>
                <Text style={styles.timeSeparatorText}>:</Text>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Minute</Text>
                <ScrollView style={styles.timeColumnScroll} scrollEventThrottle={16}>
                  {Array.from({ length: 60 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.timeOption,
                        tempEndMinute === i && styles.timeOptionSelected,
                      ]}
                      onPress={() => setTempEndMinute(i)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          tempEndMinute === i && styles.timeOptionTextSelected,
                        ]}
                      >
                        {String(i).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={styles.timeDisplay}>
              {formatTime(tempEndHour, tempEndMinute)}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
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
  timeRangeContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  timeRangeLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  timeRangeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9C27B0',
  },
  timeSettings: {
    marginBottom: 16,
    gap: 12,
  },
  timeSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  timeSettingContent: {
    flex: 1,
  },
  timeSettingLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 2,
  },
  timeSettingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  timeSettingDescription: {
    fontSize: 11,
    color: '#999',
  },
  timeSettingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#9C27B0',
    borderRadius: 6,
  },
  timeSettingButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A1B9A',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 11,
    color: '#6A1B9A',
    lineHeight: 16,
  },
  disabledInfo: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  disabledInfoText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalHeaderButton: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9C27B0',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalHeaderButtonActive: {
    fontWeight: '600',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    marginVertical: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  timeColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeColumnLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  timeColumnScroll: {
    height: 150,
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timeOptionSelected: {
    backgroundColor: '#F3E5F5',
    borderRadius: 6,
  },
  timeOptionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: '#9C27B0',
    fontWeight: '700',
  },
  timeSeparator: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  timeSeparatorText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  timeDisplay: {
    fontSize: 28,
    fontWeight: '700',
    color: '#9C27B0',
    textAlign: 'center',
    marginBottom: 16,
  },
});
