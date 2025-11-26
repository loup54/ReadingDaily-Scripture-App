/**
 * Daily Reminder Picker Component
 * Phase 10B.6: Settings Integration
 *
 * Time picker for configuring daily reminder notifications
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { DailyReminder } from '@/types/notifications.types';

/**
 * Daily Reminder Picker Props
 */
interface DailyReminderPickerProps {
  reminder: DailyReminder | null;
  onReminderChange: (reminder: DailyReminder) => void;
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
 * Parse time string to hours and minutes
 */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

/**
 * Daily Reminder Picker Component
 */
export function DailyReminderPicker({
  reminder,
  onReminderChange,
}: DailyReminderPickerProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(reminder?.time ? parseTime(reminder.time).hour : 8);
  const [selectedMinute, setSelectedMinute] = useState(
    reminder?.time ? parseTime(reminder.time).minute : 0
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    reminder?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
  );

  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /**
   * Handle day toggle
   */
  const handleDayToggle = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort((a, b) => a - b));
    }
  };

  /**
   * Handle save time
   */
  const handleSaveTime = () => {
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    const time = formatTime(selectedHour, selectedMinute);
    onReminderChange({
      enabled: true,
      time,
      daysOfWeek: selectedDays,
      message: reminder?.message || 'Time to read scripture',
      nextScheduledTime: new Date().getTime(),
    });

    setShowTimePicker(false);
  };

  const currentTime = formatTime(selectedHour, selectedMinute);
  const selectedDayNames = selectedDays.map((d) => dayLabels[d].substring(0, 3)).join(', ');

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Reminder</Text>
        <Text style={styles.subtitle}>Configure when you receive reminders</Text>
      </View>

      {/* Current Settings Display */}
      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>Reminder Time</Text>
          <Text style={styles.settingValue}>{currentTime}</Text>
          {selectedDayNames && (
            <Text style={styles.dayList}>{selectedDayNames}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Message Input Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Reminders are sent at the selected time to encourage consistent reading
        </Text>
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalHeaderButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Set Reminder Time</Text>
              <TouchableOpacity onPress={handleSaveTime}>
                <Text style={[styles.modalHeaderButton, styles.modalHeaderButtonActive]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Time Selection */}
              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>Time</Text>
                <View style={styles.timePickerContainer}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeColumnLabel}>Hour</Text>
                    <ScrollView
                      scrollEnabled={true}
                      style={styles.timeColumnScroll}
                      scrollEventThrottle={16}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.timeOption,
                            selectedHour === i && styles.timeOptionSelected,
                          ]}
                          onPress={() => setSelectedHour(i)}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              selectedHour === i && styles.timeOptionTextSelected,
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
                    <ScrollView
                      scrollEnabled={true}
                      style={styles.timeColumnScroll}
                      scrollEventThrottle={16}
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.timeOption,
                            selectedMinute === i && styles.timeOptionSelected,
                          ]}
                          onPress={() => setSelectedMinute(i)}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              selectedMinute === i && styles.timeOptionTextSelected,
                            ]}
                          >
                            {String(i).padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                <Text style={styles.timeDisplayLarge}>{currentTime}</Text>
              </View>

              {/* Days Selection */}
              <View style={styles.daysSection}>
                <Text style={styles.daysLabel}>Days to Remind</Text>
                <View style={styles.daysGrid}>
                  {dayLabels.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayButton,
                        selectedDays.includes(index) && styles.dayButtonSelected,
                      ]}
                      onPress={() => handleDayToggle(index)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          selectedDays.includes(index) && styles.dayButtonTextSelected,
                        ]}
                      >
                        {day.substring(0, 1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.daysHelp}>Selected: {selectedDayNames || 'None'}</Text>
              </View>
            </ScrollView>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  dayList: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 16,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalHeaderButton: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalHeaderButtonActive: {
    fontWeight: '600',
  },
  modalScroll: {
    paddingHorizontal: 16,
  },
  timeSection: {
    paddingVertical: 16,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    marginBottom: 16,
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
    backgroundColor: '#E6F0FF',
    borderRadius: 6,
  },
  timeOptionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: '#007AFF',
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
  timeDisplayLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 12,
  },
  daysSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayButton: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  daysHelp: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});
